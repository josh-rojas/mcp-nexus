use crate::models::{ClientConfigInfo, ClientId, ConfigFormat, DetectedClient};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ClientDetectionError {
    #[error("Home directory not found")]
    HomeNotFound,
    #[error("Failed to read config file: {0}")]
    ReadError(#[from] std::io::Error),
    #[error("Failed to parse config file: {0}")]
    ParseError(#[from] serde_json::Error),
}

/// Get the user's home directory
fn home_dir() -> Result<PathBuf, ClientDetectionError> {
    dirs::home_dir().ok_or(ClientDetectionError::HomeNotFound)
}

/// Get the config path for a specific client
pub fn get_client_config_path(client_id: ClientId) -> Result<PathBuf, ClientDetectionError> {
    let home = home_dir()?;

    let path = match client_id {
        ClientId::ClaudeCode => home.join(".claude.json"),
        ClientId::ClaudeDesktop => home
            .join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json"),
        ClientId::Cursor => home.join(".cursor").join("mcp.json"),
        ClientId::Vscode => home.join(".vscode").join("mcp.json"),
        ClientId::Cline => home
            .join("Documents")
            .join("Cline")
            .join("cline_mcp_settings.json"),
        ClientId::Continue => home.join(".continue").join("config.json"),
        ClientId::Windsurf => home
            .join(".codeium")
            .join("windsurf")
            .join("mcp_config.json"),
        ClientId::Warp => {
            // Warp uses internal storage, but we return a placeholder path
            // for documentation purposes
            home.join(".warp").join("mcp_config.json")
        }
    };

    Ok(path)
}

/// Parse an MCP servers config and count servers
fn parse_mcp_config(content: &str, format: ConfigFormat) -> Result<ClientConfigInfo, ClientDetectionError> {
    let json: Value = serde_json::from_str(content)?;

    let (server_count, server_names, raw_config) = match format {
        ConfigFormat::Standard => {
            // {"mcpServers": {"name": {...}, ...}}
            if let Some(servers) = json.get("mcpServers").and_then(|v| v.as_object()) {
                let names: Vec<String> = servers.keys().cloned().collect();
                let count = names.len();
                let raw: HashMap<String, Value> = servers
                    .iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect();
                (count, names, Some(raw))
            } else {
                (0, vec![], None)
            }
        }
        ConfigFormat::Vscode => {
            // {"mcp": {"servers": {"name": {...}, ...}}}
            if let Some(servers) = json
                .get("mcp")
                .and_then(|v| v.get("servers"))
                .and_then(|v| v.as_object())
            {
                let names: Vec<String> = servers.keys().cloned().collect();
                let count = names.len();
                let raw: HashMap<String, Value> = servers
                    .iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect();
                (count, names, Some(raw))
            } else {
                (0, vec![], None)
            }
        }
        ConfigFormat::Continue => {
            // {"mcpServers": [...]} - array format, or may be embedded in larger config
            if let Some(servers) = json.get("mcpServers").and_then(|v| v.as_array()) {
                let names: Vec<String> = servers
                    .iter()
                    .filter_map(|v| v.get("name").and_then(|n| n.as_str()).map(String::from))
                    .collect();
                let count = servers.len();
                (count, names, None)
            } else if let Some(servers) = json.get("mcpServers").and_then(|v| v.as_object()) {
                // Continue might also use object format
                let names: Vec<String> = servers.keys().cloned().collect();
                let count = names.len();
                let raw: HashMap<String, Value> = servers
                    .iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect();
                (count, names, Some(raw))
            } else {
                (0, vec![], None)
            }
        }
    };

    Ok(ClientConfigInfo {
        server_count,
        server_names,
        raw_config,
    })
}

/// Detect a single client
pub fn detect_client(client_id: ClientId) -> DetectedClient {
    let mut client = DetectedClient::new(client_id);

    // Get config path
    match get_client_config_path(client_id) {
        Ok(path) => {
            client.config_path = Some(path.clone());

            // Special handling for Warp - it's manual only
            if client_id == ClientId::Warp {
                // Warp uses internal config, we just mark it as detected but manual
                client.detected = true;
                client.config_exists = false;
                return client;
            }

            // Check if config file exists
            if path.exists() {
                client.config_exists = true;
                client.detected = true;

                // Try to parse and count servers
                match fs::read_to_string(&path) {
                    Ok(content) => {
                        match parse_mcp_config(&content, client.config_format) {
                            Ok(info) => {
                                client.server_count = info.server_count;
                            }
                            Err(e) => {
                                // Config exists but couldn't be parsed
                                client.error = Some(format!("Failed to parse config: {}", e));
                            }
                        }
                    }
                    Err(e) => {
                        client.error = Some(format!("Failed to read config: {}", e));
                    }
                }
            } else {
                // Config doesn't exist, but we might still detect the client
                // by checking for the parent directory or application
                let detected = match client_id {
                    ClientId::ClaudeDesktop => {
                        // Check if Claude.app exists
                        let app_path = PathBuf::from("/Applications/Claude.app");
                        app_path.exists()
                    }
                    ClientId::Cursor => {
                        // Check if Cursor.app exists or .cursor directory
                        let app_path = PathBuf::from("/Applications/Cursor.app");
                        let dir_path = path.parent().map(|p| p.exists()).unwrap_or(false);
                        app_path.exists() || dir_path
                    }
                    ClientId::Vscode => {
                        // Check if VS Code is installed
                        let app_path = PathBuf::from("/Applications/Visual Studio Code.app");
                        let dir_path = path.parent().map(|p| p.exists()).unwrap_or(false);
                        app_path.exists() || dir_path
                    }
                    ClientId::Windsurf => {
                        // Check if Windsurf.app exists
                        let app_path = PathBuf::from("/Applications/Windsurf.app");
                        app_path.exists()
                    }
                    ClientId::Cline => {
                        // Check if Cline directory exists
                        path.parent().map(|p| p.exists()).unwrap_or(false)
                    }
                    ClientId::Continue => {
                        // Check if .continue directory exists
                        path.parent().map(|p| p.exists()).unwrap_or(false)
                    }
                    ClientId::ClaudeCode => {
                        // Claude Code is CLI-based, check if installed
                        // For now, assume if the tool is asking, it's probably installed
                        true
                    }
                    ClientId::Warp => {
                        // Handled above
                        false
                    }
                };

                client.detected = detected;
            }
        }
        Err(e) => {
            client.error = Some(format!("Failed to determine config path: {}", e));
        }
    }

    client
}

/// Detect all supported clients
pub fn detect_all_clients() -> Vec<DetectedClient> {
    ClientId::all().into_iter().map(detect_client).collect()
}

/// Get detailed config info for a client (for import purposes)
pub fn get_client_config_info(client_id: ClientId) -> Result<Option<ClientConfigInfo>, ClientDetectionError> {
    let path = get_client_config_path(client_id)?;

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)?;
    let client = DetectedClient::new(client_id);
    let info = parse_mcp_config(&content, client.config_format)?;

    Ok(Some(info))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SyncMode;

    #[test]
    fn test_get_client_config_path_claude_code() {
        let path = get_client_config_path(ClientId::ClaudeCode).unwrap();
        assert!(path.ends_with(".claude.json"));
    }

    #[test]
    fn test_get_client_config_path_claude_desktop() {
        let path = get_client_config_path(ClientId::ClaudeDesktop).unwrap();
        assert!(path.to_string_lossy().contains("Application Support"));
        assert!(path.ends_with("claude_desktop_config.json"));
    }

    #[test]
    fn test_get_client_config_path_cursor() {
        let path = get_client_config_path(ClientId::Cursor).unwrap();
        assert!(path.to_string_lossy().contains(".cursor"));
        assert!(path.ends_with("mcp.json"));
    }

    #[test]
    fn test_get_client_config_path_vscode() {
        let path = get_client_config_path(ClientId::Vscode).unwrap();
        assert!(path.to_string_lossy().contains(".vscode"));
        assert!(path.ends_with("mcp.json"));
    }

    #[test]
    fn test_get_client_config_path_cline() {
        let path = get_client_config_path(ClientId::Cline).unwrap();
        assert!(path.to_string_lossy().contains("Cline"));
        assert!(path.ends_with("cline_mcp_settings.json"));
    }

    #[test]
    fn test_get_client_config_path_continue() {
        let path = get_client_config_path(ClientId::Continue).unwrap();
        assert!(path.to_string_lossy().contains(".continue"));
        assert!(path.ends_with("config.json"));
    }

    #[test]
    fn test_get_client_config_path_windsurf() {
        let path = get_client_config_path(ClientId::Windsurf).unwrap();
        assert!(path.to_string_lossy().contains(".codeium"));
        assert!(path.ends_with("mcp_config.json"));
    }

    #[test]
    fn test_parse_mcp_config_standard() {
        let content = r#"{
            "mcpServers": {
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem"]
                },
                "brave-search": {
                    "command": "npx",
                    "args": ["-y", "@anthropic/mcp-server-brave-search"]
                }
            }
        }"#;

        let info = parse_mcp_config(content, ConfigFormat::Standard).unwrap();
        assert_eq!(info.server_count, 2);
        assert!(info.server_names.contains(&"filesystem".to_string()));
        assert!(info.server_names.contains(&"brave-search".to_string()));
    }

    #[test]
    fn test_parse_mcp_config_vscode() {
        let content = r#"{
            "mcp": {
                "servers": {
                    "filesystem": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-filesystem"]
                    }
                }
            }
        }"#;

        let info = parse_mcp_config(content, ConfigFormat::Vscode).unwrap();
        assert_eq!(info.server_count, 1);
        assert!(info.server_names.contains(&"filesystem".to_string()));
    }

    #[test]
    fn test_parse_mcp_config_empty() {
        let content = r#"{}"#;
        let info = parse_mcp_config(content, ConfigFormat::Standard).unwrap();
        assert_eq!(info.server_count, 0);
        assert!(info.server_names.is_empty());
    }

    #[test]
    fn test_detect_client_warp() {
        let client = detect_client(ClientId::Warp);
        assert_eq!(client.sync_mode, SyncMode::ManualOnly);
        assert!(client.docs_url.is_some());
        // Warp is always "detected" since it's manual-only
        assert!(client.detected);
    }

    #[test]
    fn test_detect_all_clients() {
        let clients = detect_all_clients();
        assert_eq!(clients.len(), 8);

        // Verify all client IDs are present
        let ids: Vec<ClientId> = clients.iter().map(|c| c.id).collect();
        assert!(ids.contains(&ClientId::ClaudeCode));
        assert!(ids.contains(&ClientId::ClaudeDesktop));
        assert!(ids.contains(&ClientId::Cursor));
        assert!(ids.contains(&ClientId::Vscode));
        assert!(ids.contains(&ClientId::Cline));
        assert!(ids.contains(&ClientId::Continue));
        assert!(ids.contains(&ClientId::Windsurf));
        assert!(ids.contains(&ClientId::Warp));
    }
}
