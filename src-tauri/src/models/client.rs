use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// All supported AI client types that can use MCP servers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClientId {
    /// Claude Code CLI tool
    ClaudeCode,
    /// Claude Desktop application
    ClaudeDesktop,
    /// Cursor editor
    Cursor,
    /// VS Code with MCP extension
    Vscode,
    /// Cline extension
    Cline,
    /// Continue.dev extension
    Continue,
    /// Windsurf editor
    Windsurf,
    /// Warp terminal (manual configuration only)
    Warp,
}

impl ClientId {
    /// Get all supported client IDs
    pub fn all() -> Vec<ClientId> {
        vec![
            ClientId::ClaudeCode,
            ClientId::ClaudeDesktop,
            ClientId::Cursor,
            ClientId::Vscode,
            ClientId::Cline,
            ClientId::Continue,
            ClientId::Windsurf,
            ClientId::Warp,
        ]
    }

    /// Get the display name for this client
    pub fn display_name(&self) -> &'static str {
        match self {
            ClientId::ClaudeCode => "Claude Code",
            ClientId::ClaudeDesktop => "Claude Desktop",
            ClientId::Cursor => "Cursor",
            ClientId::Vscode => "VS Code",
            ClientId::Cline => "Cline",
            ClientId::Continue => "Continue.dev",
            ClientId::Windsurf => "Windsurf",
            ClientId::Warp => "Warp",
        }
    }

    /// Get the string identifier for this client (used in config)
    pub fn as_str(&self) -> &'static str {
        match self {
            ClientId::ClaudeCode => "claude-code",
            ClientId::ClaudeDesktop => "claude-desktop",
            ClientId::Cursor => "cursor",
            ClientId::Vscode => "vscode",
            ClientId::Cline => "cline",
            ClientId::Continue => "continue",
            ClientId::Windsurf => "windsurf",
            ClientId::Warp => "warp",
        }
    }

    /// Get the icon name for this client (for UI)
    #[allow(dead_code)]
    pub fn icon_name(&self) -> &'static str {
        match self {
            ClientId::ClaudeCode => "terminal",
            ClientId::ClaudeDesktop => "message-square",
            ClientId::Cursor => "code",
            ClientId::Vscode => "file-code",
            ClientId::Cline => "bot",
            ClientId::Continue => "play-circle",
            ClientId::Windsurf => "wind",
            ClientId::Warp => "terminal-square",
        }
    }
}

impl std::fmt::Display for ClientId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// The sync mode for a client - determines how configuration is synced
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncMode {
    /// Automatic file-based sync (standard mode)
    Automatic,
    /// Manual configuration only (e.g., Warp requires copy-paste into UI)
    ManualOnly,
}

/// The configuration format used by a client
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConfigFormat {
    /// Standard MCP format: {"mcpServers": {...}}
    Standard,
    /// VS Code format: {"mcp": {"servers": {...}}}
    Vscode,
    /// Continue.dev format: config.json with mcpServers array
    Continue,
}

/// Information about a detected AI client installation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedClient {
    /// Client identifier
    pub id: ClientId,
    /// Display name
    pub name: String,
    /// Whether the client was detected as installed
    pub detected: bool,
    /// Path to the client's MCP config file (if applicable)
    pub config_path: Option<PathBuf>,
    /// Whether the config file exists
    pub config_exists: bool,
    /// Number of MCP servers currently configured in this client
    pub server_count: usize,
    /// How this client syncs (automatic vs manual)
    pub sync_mode: SyncMode,
    /// The config format this client uses
    pub config_format: ConfigFormat,
    /// Any detection error message
    pub error: Option<String>,
    /// Documentation URL for manual configuration
    pub docs_url: Option<String>,
}

impl DetectedClient {
    /// Create a new detected client
    pub fn new(id: ClientId) -> Self {
        let (sync_mode, config_format, docs_url) = match id {
            ClientId::Warp => (
                SyncMode::ManualOnly,
                ConfigFormat::Standard,
                Some("https://docs.warp.dev/features/mcp".to_string()),
            ),
            ClientId::Vscode => (SyncMode::Automatic, ConfigFormat::Vscode, None),
            ClientId::Continue => (SyncMode::Automatic, ConfigFormat::Continue, None),
            _ => (SyncMode::Automatic, ConfigFormat::Standard, None),
        };

        Self {
            id,
            name: id.display_name().to_string(),
            detected: false,
            config_path: None,
            config_exists: false,
            server_count: 0,
            sync_mode,
            config_format,
            error: None,
            docs_url,
        }
    }
}

/// Status of a client's sync state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSyncStatus {
    /// Client identifier
    pub client_id: ClientId,
    /// Whether sync is enabled for this client
    pub enabled: bool,
    /// Last sync timestamp (ISO format)
    pub last_sync: Option<String>,
    /// Checksum of the config at last sync
    pub last_sync_checksum: Option<String>,
    /// Whether the config has been modified externally since last sync
    pub externally_modified: bool,
    /// Any sync errors
    pub sync_error: Option<String>,
}

/// Result of parsing an existing client config
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientConfigInfo {
    /// Number of servers in the config
    pub server_count: usize,
    /// Names of the servers
    pub server_names: Vec<String>,
    /// Raw config data for potential import
    pub raw_config: Option<HashMap<String, serde_json::Value>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_id_all() {
        let all = ClientId::all();
        assert_eq!(all.len(), 8);
        assert!(all.contains(&ClientId::ClaudeCode));
        assert!(all.contains(&ClientId::Warp));
    }

    #[test]
    fn test_client_id_display_name() {
        assert_eq!(ClientId::ClaudeCode.display_name(), "Claude Code");
        assert_eq!(ClientId::ClaudeDesktop.display_name(), "Claude Desktop");
        assert_eq!(ClientId::Continue.display_name(), "Continue.dev");
    }

    #[test]
    fn test_client_id_as_str() {
        assert_eq!(ClientId::ClaudeCode.as_str(), "claude-code");
        assert_eq!(ClientId::Vscode.as_str(), "vscode");
    }

    #[test]
    fn test_detected_client_warp_manual() {
        let client = DetectedClient::new(ClientId::Warp);
        assert_eq!(client.sync_mode, SyncMode::ManualOnly);
        assert!(client.docs_url.is_some());
    }

    #[test]
    fn test_detected_client_vscode_format() {
        let client = DetectedClient::new(ClientId::Vscode);
        assert_eq!(client.config_format, ConfigFormat::Vscode);
        assert_eq!(client.sync_mode, SyncMode::Automatic);
    }

    #[test]
    fn test_client_id_serialization() {
        let id = ClientId::ClaudeCode;
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, r#""claude-code""#);

        let parsed: ClientId = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, ClientId::ClaudeCode);
    }
}
