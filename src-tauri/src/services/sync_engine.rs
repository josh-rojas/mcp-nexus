use crate::models::{
    ClientId, ClientSettings, ConfigFormat, McpHubConfig, McpServer, ServerSource, SyncMode,
    Transport,
};
use crate::services::client_detector::{detect_client, get_client_config_path};
use crate::services::keychain::{is_keychain_reference, resolve_keychain_reference};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
#[allow(dead_code)] // Variants are part of public API, used by callers
pub enum SyncError {
    #[error("Home directory not found")]
    HomeNotFound,
    #[error("Failed to read file: {0}")]
    ReadError(String),
    #[error("Failed to write file: {0}")]
    WriteError(String),
    #[error("Failed to parse JSON: {0}")]
    ParseError(String),
    #[error("Failed to serialize JSON: {0}")]
    SerializeError(String),
    #[error("Client not found: {0}")]
    ClientNotFound(String),
    #[error("Client requires manual configuration: {0}")]
    ManualConfigRequired(String),
    #[error("Failed to create backup: {0}")]
    BackupError(String),
    #[error("Failed to create directory: {0}")]
    DirectoryError(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("Failed to resolve credential: {0}")]
    CredentialError(String),
}

/// Result of syncing to a single client
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSyncResult {
    pub client_id: ClientId,
    pub success: bool,
    pub servers_synced: usize,
    pub backup_path: Option<String>,
    pub error: Option<String>,
    pub manual_config: Option<String>,
}

/// Result of syncing to all clients
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub total_clients: usize,
    pub successful: usize,
    pub failed: usize,
    pub manual_required: usize,
    pub results: Vec<ClientSyncResult>,
}

/// Result of importing from a client
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub client_id: ClientId,
    pub servers_imported: usize,
    pub server_names: Vec<String>,
    pub skipped_existing: usize,
}

/// Options for transforming server config
#[derive(Debug, Clone, Default)]
pub struct TransformOptions {
    /// Whether to resolve keychain references to actual values
    /// Set to true when syncing to client configs that will run servers
    /// Set to false when generating display output (like Warp manual config)
    pub resolve_credentials: bool,
}

/// Transform a server to the standard MCP config format
/// Output: {"command": "...", "args": [...], "env": {...}} for stdio
/// Output: {"url": "...", "transport": "sse"} for SSE
///
/// If `resolve_credentials` is true, keychain references in env vars will be
/// resolved to actual values. This is used when syncing to client configs.
fn transform_server_to_standard(server: &McpServer, options: &TransformOptions) -> Result<Value, SyncError> {
    match &server.transport {
        Transport::Stdio { command, args, env } => {
            let mut obj = Map::new();
            obj.insert("command".to_string(), json!(command));

            if !args.is_empty() {
                obj.insert("args".to_string(), json!(args));
            }

            // Transform env values, optionally resolving keychain references
            if !env.is_empty() {
                let mut transformed_env: HashMap<String, String> = HashMap::new();

                for (k, v) in env {
                    let resolved_value = if options.resolve_credentials && is_keychain_reference(v) {
                        // Resolve keychain reference to actual value
                        resolve_keychain_reference(v)
                            .map_err(|e| SyncError::CredentialError(format!("Failed to resolve '{}': {}", k, e)))?
                    } else {
                        // Keep original value (either not a reference or not resolving)
                        v.clone()
                    };
                    transformed_env.insert(k.clone(), resolved_value);
                }

                obj.insert("env".to_string(), json!(transformed_env));
            }

            Ok(Value::Object(obj))
        }
        Transport::Sse { url, headers } => {
            let mut obj = Map::new();

            // Resolve URL if it's a keychain reference (rare but possible)
            let resolved_url = if options.resolve_credentials && is_keychain_reference(url) {
                resolve_keychain_reference(url)
                    .map_err(|e| SyncError::CredentialError(format!("Failed to resolve URL: {}", e)))?
            } else {
                url.clone()
            };
            obj.insert("url".to_string(), json!(resolved_url));
            obj.insert("transport".to_string(), json!("sse"));

            if !headers.is_empty() {
                let mut resolved_headers: HashMap<String, String> = HashMap::new();

                for (k, v) in headers {
                    let resolved_value = if options.resolve_credentials && is_keychain_reference(v) {
                        resolve_keychain_reference(v)
                            .map_err(|e| SyncError::CredentialError(format!("Failed to resolve header '{}': {}", k, e)))?
                    } else {
                        v.clone()
                    };
                    resolved_headers.insert(k.clone(), resolved_value);
                }

                obj.insert("headers".to_string(), json!(resolved_headers));
            }

            Ok(Value::Object(obj))
        }
    }
}

/// Transform servers to standard format: {"mcpServers": {"name": {...}, ...}}
fn transform_to_standard_format(servers: &[&McpServer], options: &TransformOptions) -> Result<Value, SyncError> {
    let mut mcp_servers = Map::new();

    for server in servers {
        let server_config = transform_server_to_standard(server, options)?;
        mcp_servers.insert(server.name.clone(), server_config);
    }

    Ok(json!({ "mcpServers": mcp_servers }))
}

/// Transform servers to VS Code format: {"mcp": {"servers": {"name": {...}, ...}}}
fn transform_to_vscode_format(servers: &[&McpServer], existing_config: Option<&Value>, options: &TransformOptions) -> Result<Value, SyncError> {
    let mut mcp_servers = Map::new();

    for server in servers {
        let server_config = transform_server_to_standard(server, options)?;
        mcp_servers.insert(server.name.clone(), server_config);
    }

    // Preserve existing settings in the config
    if let Some(existing) = existing_config {
        let mut config = existing.clone();
        if let Some(obj) = config.as_object_mut() {
            // Create or update the mcp.servers path
            if !obj.contains_key("mcp") {
                obj.insert("mcp".to_string(), json!({}));
            }
            if let Some(mcp) = obj.get_mut("mcp").and_then(|v| v.as_object_mut()) {
                mcp.insert("servers".to_string(), Value::Object(mcp_servers));
            }
            return Ok(Value::Object(obj.clone()));
        }
    }

    // No existing config, create new
    Ok(json!({
        "mcp": {
            "servers": mcp_servers
        }
    }))
}

/// Transform servers to Continue.dev format, merging with existing config
fn transform_to_continue_format(servers: &[&McpServer], existing_config: Option<&Value>, options: &TransformOptions) -> Result<Value, SyncError> {
    let mut mcp_servers = Map::new();

    for server in servers {
        let server_config = transform_server_to_standard(server, options)?;
        mcp_servers.insert(server.name.clone(), server_config);
    }

    // Continue.dev uses the standard format but we must preserve other settings
    if let Some(existing) = existing_config {
        let mut config = existing.clone();
        if let Some(obj) = config.as_object_mut() {
            obj.insert("mcpServers".to_string(), Value::Object(mcp_servers));
            return Ok(Value::Object(obj.clone()));
        }
    }

    // No existing config
    Ok(json!({ "mcpServers": mcp_servers }))
}

/// Generate manual config JSON for Warp
/// Note: Does NOT resolve credentials - shows keychain references for manual copy
fn generate_warp_config(servers: &[&McpServer]) -> String {
    // Don't resolve credentials for display - user needs to see references
    let options = TransformOptions { resolve_credentials: false };
    let config = match transform_to_standard_format(servers, &options) {
        Ok(c) => c,
        Err(_) => return "{}".to_string(),
    };
    serde_json::to_string_pretty(&config).unwrap_or_default()
}

/// Read existing client config file, if it exists
fn read_existing_config(path: &PathBuf) -> Result<Option<Value>, SyncError> {
    if !path.exists() {
        return Ok(None);
    }

    let mut file = File::open(path).map_err(|e| SyncError::ReadError(e.to_string()))?;
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| SyncError::ReadError(e.to_string()))?;

    // Handle empty files
    if content.trim().is_empty() {
        return Ok(None);
    }

    let value: Value = serde_json::from_str(&content)
        .map_err(|e| SyncError::ParseError(e.to_string()))?;

    Ok(Some(value))
}

/// Create a backup of an existing config file
fn create_backup(path: &PathBuf) -> Result<Option<PathBuf>, SyncError> {
    if !path.exists() {
        return Ok(None);
    }

    let backup_path = path.with_extension("json.bak");
    fs::copy(path, &backup_path).map_err(|e| SyncError::BackupError(e.to_string()))?;

    Ok(Some(backup_path))
}

/// Write config to file with atomic write and proper permissions
fn write_config_file(path: &PathBuf, content: &str) -> Result<(), SyncError> {
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| SyncError::DirectoryError(e.to_string()))?;

            // Set directory permissions to 0700
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let permissions = fs::Permissions::from_mode(0o700);
                fs::set_permissions(parent, permissions)?;
            }
        }
    }

    // Write to temp file first
    let temp_path = path.with_extension("json.tmp");
    {
        let mut file = File::create(&temp_path)?;
        file.write_all(content.as_bytes())?;
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
    fs::rename(&temp_path, path)?;

    Ok(())
}

/// Compute checksum of file content
pub fn compute_checksum(content: &[u8]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Sync configuration to a single client
pub fn sync_to_client(
    client_id: ClientId,
    config: &McpHubConfig,
) -> ClientSyncResult {
    // Check if client requires manual configuration
    let detected = detect_client(client_id);

    if detected.sync_mode == SyncMode::ManualOnly {
        // Generate manual config for display
        let servers: Vec<&McpServer> = config.get_servers_for_client(client_id.as_str());
        let manual_config = generate_warp_config(&servers);

        return ClientSyncResult {
            client_id,
            success: true, // Not a failure, just manual
            servers_synced: servers.len(),
            backup_path: None,
            error: None,
            manual_config: Some(manual_config),
        };
    }

    // Get config path
    let config_path = match get_client_config_path(client_id) {
        Ok(path) => path,
        Err(e) => {
            return ClientSyncResult {
                client_id,
                success: false,
                servers_synced: 0,
                backup_path: None,
                error: Some(e.to_string()),
                manual_config: None,
            };
        }
    };

    // Get servers enabled for this client
    let servers: Vec<&McpServer> = config.get_servers_for_client(client_id.as_str());

    // Read existing config (to preserve other settings)
    let existing_config = match read_existing_config(&config_path) {
        Ok(config) => config,
        Err(e) => {
            return ClientSyncResult {
                client_id,
                success: false,
                servers_synced: 0,
                backup_path: None,
                error: Some(format!("Failed to read existing config: {}", e)),
                manual_config: None,
            };
        }
    };

    // Create backup if file exists
    let backup_path = match create_backup(&config_path) {
        Ok(path) => path.map(|p| p.to_string_lossy().to_string()),
        Err(e) => {
            return ClientSyncResult {
                client_id,
                success: false,
                servers_synced: 0,
                backup_path: None,
                error: Some(format!("Failed to create backup: {}", e)),
                manual_config: None,
            };
        }
    };

    // Transform servers to client-specific format
    // Resolve credentials when syncing to client configs
    let options = TransformOptions { resolve_credentials: true };

    let output = match detected.config_format {
        ConfigFormat::Standard => transform_to_standard_format(&servers, &options),
        ConfigFormat::Vscode => transform_to_vscode_format(&servers, existing_config.as_ref(), &options),
        ConfigFormat::Continue => transform_to_continue_format(&servers, existing_config.as_ref(), &options),
    };

    let output = match output {
        Ok(o) => o,
        Err(e) => {
            return ClientSyncResult {
                client_id,
                success: false,
                servers_synced: 0,
                backup_path,
                error: Some(format!("Failed to transform config: {}", e)),
                manual_config: None,
            };
        }
    };

    // Serialize and write
    let json_content = match serde_json::to_string_pretty(&output) {
        Ok(content) => content,
        Err(e) => {
            return ClientSyncResult {
                client_id,
                success: false,
                servers_synced: 0,
                backup_path,
                error: Some(format!("Failed to serialize config: {}", e)),
                manual_config: None,
            };
        }
    };

    if let Err(e) = write_config_file(&config_path, &json_content) {
        return ClientSyncResult {
            client_id,
            success: false,
            servers_synced: 0,
            backup_path,
            error: Some(format!("Failed to write config: {}", e)),
            manual_config: None,
        };
    }

    ClientSyncResult {
        client_id,
        success: true,
        servers_synced: servers.len(),
        backup_path,
        error: None,
        manual_config: None,
    }
}

/// Sync configuration to all enabled clients
pub fn sync_to_all_clients(config: &McpHubConfig) -> SyncResult {
    let mut results = Vec::new();
    let mut successful = 0;
    let mut failed = 0;
    let mut manual_required = 0;

    for client_id in ClientId::all() {
        // Check if sync is enabled for this client
        let client_settings = config.clients.get(client_id.as_str());
        let enabled = client_settings.map(|s| s.enabled).unwrap_or(true);

        if !enabled {
            continue;
        }

        let result = sync_to_client(client_id, config);

        if result.manual_config.is_some() {
            manual_required += 1;
            successful += 1; // Manual configs are considered successful
        } else if result.success {
            successful += 1;
        } else {
            failed += 1;
        }

        results.push(result);
    }

    SyncResult {
        total_clients: results.len(),
        successful,
        failed,
        manual_required,
        results,
    }
}

/// Parse servers from a client's raw config
fn parse_servers_from_raw_config(
    raw_config: &HashMap<String, Value>,
    source_client: ClientId,
) -> Vec<McpServer> {
    let mut servers = Vec::new();

    for (name, config) in raw_config {
        if let Some(server) = parse_single_server(name, config, source_client) {
            servers.push(server);
        }
    }

    servers
}

/// Parse a single server configuration
fn parse_single_server(name: &str, config: &Value, source_client: ClientId) -> Option<McpServer> {
    let obj = config.as_object()?;

    // Determine transport type
    let transport = if let Some(url) = obj.get("url").and_then(|v| v.as_str()) {
        // SSE transport
        let headers: HashMap<String, String> = obj
            .get("headers")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        Transport::Sse {
            url: url.to_string(),
            headers,
        }
    } else if let Some(command) = obj.get("command").and_then(|v| v.as_str()) {
        // Stdio transport
        let args: Vec<String> = obj
            .get("args")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        let env: HashMap<String, String> = obj
            .get("env")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        Transport::Stdio {
            command: command.to_string(),
            args,
            env,
        }
    } else {
        // Unknown format
        return None;
    };

    // Determine source type from command/args if possible
    let source = match &transport {
        Transport::Sse { url, .. } => ServerSource::Remote { url: url.clone() },
        Transport::Stdio { command, args, .. } => {
            if command == "npx" || command.ends_with("/npx") {
                // NPM package
                let package = args.iter()
                    .skip_while(|a| a.starts_with('-'))
                    .next()
                    .cloned()
                    .unwrap_or_else(|| name.to_string());
                ServerSource::Npm { package, version: None }
            } else if command == "uvx" || command.ends_with("/uvx") {
                // Python uvx package
                let package = args.first().cloned().unwrap_or_else(|| name.to_string());
                ServerSource::Uvx { package }
            } else if command == "docker" || command.ends_with("/docker") {
                // Docker image
                let image = args.iter()
                    .skip_while(|a| *a != "run")
                    .skip(1)
                    .skip_while(|a| a.starts_with('-'))
                    .next()
                    .cloned()
                    .unwrap_or_else(|| name.to_string());
                ServerSource::Docker { image }
            } else {
                // Assume local path
                ServerSource::Local {
                    path: format!("{} {}", command, args.join(" ")),
                }
            }
        }
    };

    let mut server = McpServer::new(name.to_string(), source, transport);
    server.description = Some(format!("Imported from {}", source_client.display_name()));

    // Enable for the source client by default
    server.enable_for_client(source_client.as_str());

    Some(server)
}

/// Import servers from a client's configuration
pub fn import_from_client(
    client_id: ClientId,
    config: &mut McpHubConfig,
    overwrite_existing: bool,
) -> Result<ImportResult, SyncError> {
    use crate::services::client_detector::get_client_config_info;

    // Get client config info
    let config_info = get_client_config_info(client_id)
        .map_err(|e| SyncError::ReadError(e.to_string()))?
        .ok_or_else(|| SyncError::ReadError("No config found for client".to_string()))?;

    let raw_config = config_info.raw_config
        .ok_or_else(|| SyncError::ParseError("Could not parse server configs".to_string()))?;

    // Parse servers from raw config
    let imported_servers = parse_servers_from_raw_config(&raw_config, client_id);

    let mut servers_imported = 0;
    let mut skipped_existing = 0;
    let mut server_names = Vec::new();

    for server in imported_servers {
        // Check if server with same name already exists
        let exists = config.servers.iter().any(|s| s.name == server.name);

        if exists && !overwrite_existing {
            skipped_existing += 1;
            continue;
        }

        if exists {
            // Remove existing server with same name
            config.servers.retain(|s| s.name != server.name);
        }

        server_names.push(server.name.clone());
        config.servers.push(server);
        servers_imported += 1;
    }

    Ok(ImportResult {
        client_id,
        servers_imported,
        server_names,
        skipped_existing,
    })
}

/// Update client settings after successful sync
pub fn update_client_sync_status(
    config: &mut McpHubConfig,
    client_id: ClientId,
    config_path: &str,
) {
    let now = chrono::Utc::now().to_rfc3339();

    // Compute checksum of the written file
    let checksum = if let Ok(content) = fs::read(config_path) {
        Some(compute_checksum(&content))
    } else {
        None
    };

    let settings = config
        .clients
        .entry(client_id.as_str().to_string())
        .or_insert_with(|| ClientSettings {
            enabled: true,
            config_path: config_path.to_string(),
            last_sync: None,
            last_sync_checksum: None,
        });

    settings.config_path = config_path.to_string();
    settings.last_sync = Some(now);
    settings.last_sync_checksum = checksum;
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_server(name: &str) -> McpServer {
        McpServer::new(
            name.to_string(),
            ServerSource::Npm {
                package: format!("@test/{}", name),
                version: None,
            },
            Transport::Stdio {
                command: "npx".to_string(),
                args: vec!["-y".to_string(), format!("@test/{}", name)],
                env: HashMap::new(),
            },
        )
    }

    fn create_test_sse_server(name: &str) -> McpServer {
        McpServer::new(
            name.to_string(),
            ServerSource::Remote {
                url: format!("https://api.example.com/{}", name),
            },
            Transport::Sse {
                url: format!("https://api.example.com/{}/sse", name),
                headers: HashMap::from([("Authorization".to_string(), "Bearer token".to_string())]),
            },
        )
    }

    fn default_options() -> TransformOptions {
        TransformOptions { resolve_credentials: false }
    }

    #[test]
    fn test_transform_server_to_standard_stdio() {
        let server = create_test_server("filesystem");
        let result = transform_server_to_standard(&server, &default_options()).unwrap();

        assert!(result.is_object());
        let obj = result.as_object().unwrap();
        assert_eq!(obj.get("command").unwrap(), "npx");
        assert!(obj.get("args").unwrap().is_array());
    }

    #[test]
    fn test_transform_server_to_standard_sse() {
        let server = create_test_sse_server("remote");
        let result = transform_server_to_standard(&server, &default_options()).unwrap();

        assert!(result.is_object());
        let obj = result.as_object().unwrap();
        assert_eq!(obj.get("transport").unwrap(), "sse");
        assert!(obj.get("url").is_some());
        assert!(obj.get("headers").is_some());
    }

    #[test]
    fn test_transform_to_standard_format() {
        let server1 = create_test_server("server1");
        let server2 = create_test_server("server2");
        let servers = vec![&server1, &server2];

        let result = transform_to_standard_format(&servers, &default_options()).unwrap();

        assert!(result.get("mcpServers").is_some());
        let mcp_servers = result.get("mcpServers").unwrap().as_object().unwrap();
        assert!(mcp_servers.contains_key("server1"));
        assert!(mcp_servers.contains_key("server2"));
    }

    #[test]
    fn test_transform_to_vscode_format() {
        let server = create_test_server("test");
        let servers = vec![&server];

        let result = transform_to_vscode_format(&servers, None, &default_options()).unwrap();

        assert!(result.get("mcp").is_some());
        let mcp = result.get("mcp").unwrap();
        assert!(mcp.get("servers").is_some());
    }

    #[test]
    fn test_transform_to_vscode_format_preserves_existing() {
        let server = create_test_server("test");
        let servers = vec![&server];

        let existing = json!({
            "editor.fontSize": 14,
            "mcp": {
                "enabled": true
            }
        });

        let result = transform_to_vscode_format(&servers, Some(&existing), &default_options()).unwrap();

        // Should preserve editor.fontSize
        assert_eq!(result.get("editor.fontSize").unwrap(), 14);
        // Should have mcp.servers
        assert!(result.get("mcp").unwrap().get("servers").is_some());
    }

    #[test]
    fn test_transform_to_continue_format() {
        let server = create_test_server("test");
        let servers = vec![&server];

        let existing = json!({
            "models": [{"title": "GPT-4"}],
            "tabAutocompleteModel": {"title": "Codestral"}
        });

        let result = transform_to_continue_format(&servers, Some(&existing), &default_options()).unwrap();

        // Should preserve existing settings
        assert!(result.get("models").is_some());
        assert!(result.get("tabAutocompleteModel").is_some());
        // Should have mcpServers
        assert!(result.get("mcpServers").is_some());
    }

    #[test]
    fn test_generate_warp_config() {
        let server = create_test_server("test");
        let servers = vec![&server];

        let result = generate_warp_config(&servers);

        assert!(result.contains("mcpServers"));
        assert!(result.contains("test"));
    }

    #[test]
    fn test_write_and_read_config_file() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("test.json");

        let content = r#"{"test": "value"}"#;
        write_config_file(&config_path, content).unwrap();

        // Verify file exists and has correct content
        let read_content = fs::read_to_string(&config_path).unwrap();
        assert_eq!(read_content, content);
    }

    #[cfg(unix)]
    #[test]
    fn test_write_config_file_permissions() {
        use std::os::unix::fs::PermissionsExt;

        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("test.json");

        write_config_file(&config_path, "{}").unwrap();

        let metadata = fs::metadata(&config_path).unwrap();
        let mode = metadata.permissions().mode();

        // Check that file is 0600 (user read/write only)
        assert_eq!(mode & 0o777, 0o600);
    }

    #[test]
    fn test_create_backup() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("test.json");

        // Create original file
        fs::write(&config_path, "original content").unwrap();

        // Create backup
        let backup_path = create_backup(&config_path).unwrap();
        assert!(backup_path.is_some());

        let backup = backup_path.unwrap();
        assert!(backup.exists());
        assert_eq!(fs::read_to_string(&backup).unwrap(), "original content");
    }

    #[test]
    fn test_create_backup_no_file() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("nonexistent.json");

        let backup_path = create_backup(&config_path).unwrap();
        assert!(backup_path.is_none());
    }

    #[test]
    fn test_parse_single_server_stdio() {
        let config = json!({
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
            "env": {"DEBUG": "true"}
        });

        let server = parse_single_server("filesystem", &config, ClientId::ClaudeCode).unwrap();

        assert_eq!(server.name, "filesystem");
        assert!(server.is_enabled_for_client("claude-code"));

        match &server.transport {
            Transport::Stdio { command, args, env } => {
                assert_eq!(command, "npx");
                assert_eq!(args.len(), 3);
                assert_eq!(env.get("DEBUG").unwrap(), "true");
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_parse_single_server_sse() {
        let config = json!({
            "url": "https://api.example.com/mcp",
            "transport": "sse",
            "headers": {"Authorization": "Bearer token"}
        });

        let server = parse_single_server("remote", &config, ClientId::Cursor).unwrap();

        assert_eq!(server.name, "remote");
        assert!(server.is_enabled_for_client("cursor"));

        match &server.transport {
            Transport::Sse { url, headers } => {
                assert_eq!(url, "https://api.example.com/mcp");
                assert_eq!(headers.get("Authorization").unwrap(), "Bearer token");
            }
            _ => panic!("Expected Sse transport"),
        }
    }

    #[test]
    fn test_compute_checksum() {
        let content1 = b"hello world";
        let content2 = b"hello world";
        let content3 = b"different";

        let checksum1 = compute_checksum(content1);
        let checksum2 = compute_checksum(content2);
        let checksum3 = compute_checksum(content3);

        assert_eq!(checksum1, checksum2);
        assert_ne!(checksum1, checksum3);
    }

    #[test]
    fn test_sync_to_client_manual_only() {
        let config = McpHubConfig::default();

        let result = sync_to_client(ClientId::Warp, &config);

        assert!(result.success);
        assert!(result.manual_config.is_some());
        assert!(result.error.is_none());
    }
}
