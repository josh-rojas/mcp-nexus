use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::McpServer;

/// Client-specific settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClientSettings {
    /// Whether syncing to this client is enabled
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Resolved config file path for this client
    pub config_path: String,
    /// ISO timestamp of last successful sync
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync: Option<String>,
    /// Checksum of the config file at last sync (for conflict detection)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_checksum: Option<String>,
}

fn default_true() -> bool {
    true
}

/// User preferences for the application
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPreferences {
    /// Automatically detect installed AI clients
    #[serde(default = "default_true")]
    pub auto_detect_clients: bool,
    /// Show system notifications
    #[serde(default = "default_true")]
    pub show_notifications: bool,
    /// Automatically sync client configs when the central config changes
    #[serde(default = "default_true")]
    pub auto_sync_on_changes: bool,
    /// Registry refresh interval in minutes
    #[serde(default = "default_refresh_interval")]
    pub registry_refresh_interval: u32,
}

fn default_refresh_interval() -> u32 {
    60 // 1 hour
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            auto_detect_clients: true,
            show_notifications: true,
            auto_sync_on_changes: true,
            registry_refresh_interval: default_refresh_interval(),
        }
    }
}

/// The central MCP Hub configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpHubConfig {
    /// Config file version for migrations
    pub version: String,
    /// List of configured MCP servers
    #[serde(default)]
    pub servers: Vec<McpServer>,
    /// Per-client settings
    #[serde(default)]
    pub clients: HashMap<String, ClientSettings>,
    /// User preferences
    #[serde(default)]
    pub preferences: UserPreferences,
}

impl Default for McpHubConfig {
    fn default() -> Self {
        Self {
            version: "1.0".to_string(),
            servers: vec![],
            clients: HashMap::new(),
            preferences: UserPreferences::default(),
        }
    }
}

impl McpHubConfig {
    /// Create a new empty configuration
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a server to the configuration
    pub fn add_server(&mut self, server: McpServer) {
        self.servers.push(server);
    }

    /// Remove a server by ID
    pub fn remove_server(&mut self, server_id: &uuid::Uuid) -> Option<McpServer> {
        if let Some(pos) = self.servers.iter().position(|s| s.id == *server_id) {
            Some(self.servers.remove(pos))
        } else {
            None
        }
    }

    /// Get a server by ID
    pub fn get_server(&self, server_id: &uuid::Uuid) -> Option<&McpServer> {
        self.servers.iter().find(|s| s.id == *server_id)
    }

    /// Get a mutable reference to a server by ID
    pub fn get_server_mut(&mut self, server_id: &uuid::Uuid) -> Option<&mut McpServer> {
        self.servers.iter_mut().find(|s| s.id == *server_id)
    }

    /// Get all servers enabled for a specific client
    #[allow(dead_code)]
    pub fn get_servers_for_client(&self, client_id: &str) -> Vec<&McpServer> {
        self.servers
            .iter()
            .filter(|s| s.is_enabled_for_client(client_id))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ServerSource, Transport};
    use std::collections::HashMap;

    fn create_test_server(name: &str) -> McpServer {
        McpServer::new(
            name.to_string(),
            ServerSource::Local {
                path: "/test".to_string(),
            },
            Transport::Stdio {
                command: "node".to_string(),
                args: vec![],
                env: HashMap::new(),
            },
        )
    }

    #[test]
    fn test_config_default() {
        let config = McpHubConfig::default();
        assert_eq!(config.version, "1.0");
        assert!(config.servers.is_empty());
        assert!(config.clients.is_empty());
    }

    #[test]
    fn test_add_remove_server() {
        let mut config = McpHubConfig::new();
        let server = create_test_server("test-server");
        let server_id = server.id;

        config.add_server(server);
        assert_eq!(config.servers.len(), 1);

        let removed = config.remove_server(&server_id);
        assert!(removed.is_some());
        assert_eq!(removed.unwrap().name, "test-server");
        assert!(config.servers.is_empty());
    }

    #[test]
    fn test_get_server() {
        let mut config = McpHubConfig::new();
        let server = create_test_server("test-server");
        let server_id = server.id;

        config.add_server(server);

        let found = config.get_server(&server_id);
        assert!(found.is_some());
        assert_eq!(found.unwrap().name, "test-server");

        let not_found = config.get_server(&uuid::Uuid::new_v4());
        assert!(not_found.is_none());
    }

    #[test]
    fn test_get_servers_for_client() {
        let mut config = McpHubConfig::new();

        let mut server1 = create_test_server("server1");
        server1.enable_for_client("claude-code");

        let mut server2 = create_test_server("server2");
        server2.enable_for_client("claude-code");
        server2.enable_for_client("cursor");

        let server3 = create_test_server("server3");
        // server3 has no clients enabled

        config.add_server(server1);
        config.add_server(server2);
        config.add_server(server3);

        let claude_servers = config.get_servers_for_client("claude-code");
        assert_eq!(claude_servers.len(), 2);

        let cursor_servers = config.get_servers_for_client("cursor");
        assert_eq!(cursor_servers.len(), 1);

        let vscode_servers = config.get_servers_for_client("vscode");
        assert_eq!(vscode_servers.len(), 0);
    }

    #[test]
    fn test_config_serialization() {
        let mut config = McpHubConfig::new();
        config.add_server(create_test_server("test-server"));

        let json = serde_json::to_string_pretty(&config).unwrap();
        let parsed: McpHubConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(config.version, parsed.version);
        assert_eq!(config.servers.len(), parsed.servers.len());
    }

    #[test]
    fn test_user_preferences_default_values() {
        let prefs = UserPreferences::default();
        assert!(prefs.auto_detect_clients);
        assert!(prefs.show_notifications);
        assert!(prefs.auto_sync_on_changes);
        assert_eq!(prefs.registry_refresh_interval, 60);
    }

    #[test]
    fn test_user_preferences_deserialization_defaults() {
        // When fields are missing, serde should populate defaults
        let json = "{}";
        let prefs: UserPreferences = serde_json::from_str(json).unwrap();

        assert!(prefs.auto_detect_clients);
        assert!(prefs.show_notifications);
        assert!(prefs.auto_sync_on_changes);
        assert_eq!(prefs.registry_refresh_interval, 60);
    }
}
