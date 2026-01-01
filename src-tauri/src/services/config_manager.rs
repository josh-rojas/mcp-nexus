use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::RwLock;
use thiserror::Error;
use uuid::Uuid;

use crate::models::{McpHubConfig, McpServer};

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("Failed to find home directory")]
    NoHomeDirectory,
    #[error("Failed to create config directory: {0}")]
    DirectoryCreation(#[from] std::io::Error),
    #[error("Failed to parse config file: {0}")]
    ParseError(#[from] serde_json::Error),
    #[error("Server not found: {0}")]
    ServerNotFound(Uuid),
}

/// Manages the central MCP Hub configuration file
pub struct ConfigManager {
    config_dir: PathBuf,
    config_path: PathBuf,
    cache: RwLock<Option<McpHubConfig>>,
}

impl ConfigManager {
    /// Create a new ConfigManager with the default path (~/.mcp-nexus/)
    pub fn new() -> Result<Self, ConfigError> {
        let home = dirs::home_dir().ok_or(ConfigError::NoHomeDirectory)?;
        let config_dir = home.join(".mcp-nexus");
        let config_path = config_dir.join("config.json");

        Ok(Self {
            config_dir,
            config_path,
            cache: RwLock::new(None),
        })
    }

    /// Create a ConfigManager with a custom path (useful for testing)
    #[cfg(test)]
    pub fn with_path(config_dir: PathBuf) -> Self {
        let config_path = config_dir.join("config.json");
        Self {
            config_dir,
            config_path,
            cache: RwLock::new(None),
        }
    }

    /// Get the path to the config directory
    pub fn config_dir(&self) -> &PathBuf {
        &self.config_dir
    }

    /// Get the path to the config file
    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }

    /// Initialize the config directory and file if they don't exist
    pub fn initialize(&self) -> Result<bool, ConfigError> {
        let mut first_run = false;

        // Create config directory with 0700 permissions
        if !self.config_dir.exists() {
            fs::create_dir_all(&self.config_dir)?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let permissions = fs::Permissions::from_mode(0o700);
                fs::set_permissions(&self.config_dir, permissions)?;
            }
            first_run = true;
        }

        // Create default config file if it doesn't exist
        if !self.config_path.exists() {
            let default_config = McpHubConfig::default();
            self.write_config(&default_config)?;
            first_run = true;
        }

        Ok(first_run)
    }

    /// Load the configuration from disk
    pub fn load(&self) -> Result<McpHubConfig, ConfigError> {
        // Check cache first
        {
            let cache = self.cache.read().unwrap();
            if let Some(ref config) = *cache {
                return Ok(config.clone());
            }
        }

        // Read from file
        let mut file = File::open(&self.config_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;

        let config: McpHubConfig = serde_json::from_str(&contents)?;

        // Update cache
        {
            let mut cache = self.cache.write().unwrap();
            *cache = Some(config.clone());
        }

        Ok(config)
    }

    /// Save the configuration to disk
    pub fn save(&self, config: &McpHubConfig) -> Result<(), ConfigError> {
        self.write_config(config)?;

        // Update cache
        {
            let mut cache = self.cache.write().unwrap();
            *cache = Some(config.clone());
        }

        Ok(())
    }

    /// Write config to disk using atomic write pattern (write to temp, then rename)
    fn write_config(&self, config: &McpHubConfig) -> Result<(), ConfigError> {
        let json = serde_json::to_string_pretty(config)?;

        // Write to temporary file first
        let temp_path = self.config_dir.join("config.json.tmp");
        {
            let mut file = File::create(&temp_path)?;
            file.write_all(json.as_bytes())?;
            file.sync_all()?;
        }

        // Set file permissions to 0600 (user-only read/write)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let permissions = fs::Permissions::from_mode(0o600);
            fs::set_permissions(&temp_path, permissions)?;
        }

        // Atomic rename
        fs::rename(&temp_path, &self.config_path)?;

        Ok(())
    }

    /// Invalidate the cache (force reload on next read)
    #[allow(dead_code)]
    pub fn invalidate_cache(&self) {
        let mut cache = self.cache.write().unwrap();
        *cache = None;
    }

    /// Get all servers
    pub fn get_servers(&self) -> Result<Vec<McpServer>, ConfigError> {
        let config = self.load()?;
        Ok(config.servers)
    }

    /// Get a single server by ID
    pub fn get_server(&self, server_id: &Uuid) -> Result<McpServer, ConfigError> {
        let config = self.load()?;
        config
            .get_server(server_id)
            .cloned()
            .ok_or(ConfigError::ServerNotFound(*server_id))
    }

    /// Add a new server
    pub fn add_server(&self, server: McpServer) -> Result<McpServer, ConfigError> {
        let mut config = self.load()?;
        let server_clone = server.clone();
        config.add_server(server);
        self.save(&config)?;
        Ok(server_clone)
    }

    /// Update an existing server
    pub fn update_server(&self, server: McpServer) -> Result<McpServer, ConfigError> {
        let mut config = self.load()?;
        let server_id = server.id;

        if let Some(pos) = config.servers.iter().position(|s| s.id == server_id) {
            config.servers[pos] = server.clone();
            self.save(&config)?;
            Ok(server)
        } else {
            Err(ConfigError::ServerNotFound(server_id))
        }
    }

    /// Remove a server by ID
    pub fn remove_server(&self, server_id: &Uuid) -> Result<McpServer, ConfigError> {
        let mut config = self.load()?;
        config
            .remove_server(server_id)
            .ok_or(ConfigError::ServerNotFound(*server_id))
            .and_then(|removed| {
                self.save(&config)?;
                Ok(removed)
            })
    }

    /// Toggle a server's enabled status for a specific client
    pub fn toggle_server_client(
        &self,
        server_id: &Uuid,
        client_id: &str,
        enabled: bool,
    ) -> Result<(), ConfigError> {
        let mut config = self.load()?;

        let server = config
            .get_server_mut(server_id)
            .ok_or(ConfigError::ServerNotFound(*server_id))?;

        if enabled {
            server.enable_for_client(client_id);
        } else {
            server.disable_for_client(client_id);
        }

        self.save(&config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ServerSource, Transport};
    use std::collections::HashMap;
    use tempfile::TempDir;

    fn create_test_manager() -> (ConfigManager, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let manager = ConfigManager::with_path(temp_dir.path().to_path_buf());
        (manager, temp_dir)
    }

    fn create_test_server(name: &str) -> McpServer {
        McpServer::new(
            name.to_string(),
            ServerSource::Npm {
                package: "@test/server".to_string(),
                version: None,
            },
            Transport::Stdio {
                command: "npx".to_string(),
                args: vec!["-y".to_string(), "@test/server".to_string()],
                env: HashMap::new(),
            },
        )
    }

    #[test]
    fn test_initialize_creates_directory_and_file() {
        let (manager, _temp) = create_test_manager();

        let first_run = manager.initialize().unwrap();
        assert!(first_run);
        assert!(manager.config_dir().exists());
        assert!(manager.config_path().exists());

        // Second run should not be "first run"
        let second_run = manager.initialize().unwrap();
        assert!(!second_run);
    }

    #[test]
    fn test_load_default_config() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let config = manager.load().unwrap();
        assert_eq!(config.version, "1.0");
        assert!(config.servers.is_empty());
    }

    #[test]
    fn test_add_and_get_server() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let server = create_test_server("test-server");
        let server_id = server.id;

        manager.add_server(server).unwrap();

        let retrieved = manager.get_server(&server_id).unwrap();
        assert_eq!(retrieved.name, "test-server");

        let all_servers = manager.get_servers().unwrap();
        assert_eq!(all_servers.len(), 1);
    }

    #[test]
    fn test_update_server() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let mut server = create_test_server("test-server");
        let server_id = server.id;
        manager.add_server(server.clone()).unwrap();

        server.name = "updated-server".to_string();
        manager.update_server(server).unwrap();

        let retrieved = manager.get_server(&server_id).unwrap();
        assert_eq!(retrieved.name, "updated-server");
    }

    #[test]
    fn test_remove_server() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let server = create_test_server("test-server");
        let server_id = server.id;
        manager.add_server(server).unwrap();

        let removed = manager.remove_server(&server_id).unwrap();
        assert_eq!(removed.name, "test-server");

        let result = manager.get_server(&server_id);
        assert!(result.is_err());
    }

    #[test]
    fn test_toggle_server_client() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let server = create_test_server("test-server");
        let server_id = server.id;
        manager.add_server(server).unwrap();

        // Enable for claude-code
        manager
            .toggle_server_client(&server_id, "claude-code", true)
            .unwrap();
        let retrieved = manager.get_server(&server_id).unwrap();
        assert!(retrieved.is_enabled_for_client("claude-code"));

        // Disable for claude-code
        manager
            .toggle_server_client(&server_id, "claude-code", false)
            .unwrap();
        let retrieved = manager.get_server(&server_id).unwrap();
        assert!(!retrieved.is_enabled_for_client("claude-code"));
    }

    #[test]
    fn test_cache_invalidation() {
        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        // Load to populate cache
        let _ = manager.load().unwrap();

        // Invalidate and reload
        manager.invalidate_cache();
        let config = manager.load().unwrap();
        assert_eq!(config.version, "1.0");
    }

    #[test]
    fn test_atomic_write() {
        let (manager, temp) = create_test_manager();
        manager.initialize().unwrap();

        let server = create_test_server("test-server");
        manager.add_server(server).unwrap();

        // Verify no temp file exists after write
        let temp_path = temp.path().join("config.json.tmp");
        assert!(!temp_path.exists());

        // Verify config file exists and is valid
        let config = manager.load().unwrap();
        assert_eq!(config.servers.len(), 1);
    }

    #[cfg(unix)]
    #[test]
    fn test_file_permissions() {
        use std::os::unix::fs::PermissionsExt;

        let (manager, _temp) = create_test_manager();
        manager.initialize().unwrap();

        let metadata = fs::metadata(manager.config_path()).unwrap();
        let mode = metadata.permissions().mode();

        // Check that file is 0600 (user read/write only)
        assert_eq!(mode & 0o777, 0o600);
    }
}
