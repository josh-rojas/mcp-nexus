use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Represents an MCP server's source/installation type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ServerSource {
    /// NPM package installed via npx
    Npm {
        package: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        version: Option<String>,
    },
    /// Python package installed via uvx
    Uvx { package: String },
    /// Local path to a server
    Local { path: String },
    /// Docker image
    Docker { image: String },
    /// Remote server (SSE)
    Remote { url: String },
    /// GitHub repository to be cloned
    Github {
        repo: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        branch: Option<String>,
    },
}

/// Transport mechanism for communicating with the MCP server
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Transport {
    /// Standard I/O communication
    Stdio {
        command: String,
        #[serde(default, skip_serializing_if = "Vec::is_empty")]
        args: Vec<String>,
        #[serde(default, skip_serializing_if = "HashMap::is_empty")]
        env: HashMap<String, String>,
    },
    /// Server-Sent Events (SSE) for remote servers
    Sse {
        url: String,
        #[serde(default, skip_serializing_if = "HashMap::is_empty")]
        headers: HashMap<String, String>,
    },
}

/// Represents an MCP server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    /// Unique identifier
    pub id: Uuid,
    /// Display name
    pub name: String,
    /// Optional description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Installation source
    pub source: ServerSource,
    /// Communication transport
    pub transport: Transport,
    /// Whether the server is globally enabled
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// List of client IDs this server is enabled for
    #[serde(default)]
    pub enabled_clients: Vec<String>,
    /// ISO timestamp of when the server was installed
    pub installed_at: String,
    /// ISO timestamp of last update
    pub updated_at: String,
    /// Installed version (for update tracking)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub installed_version: Option<String>,
    /// Link to source repository or documentation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
    /// Tags for categorization
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
}

fn default_true() -> bool {
    true
}

impl McpServer {
    /// Create a new MCP server with default values
    #[allow(dead_code)]
    pub fn new(name: String, source: ServerSource, transport: Transport) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4(),
            name,
            description: None,
            source,
            transport,
            enabled: true,
            enabled_clients: vec![],
            installed_at: now.clone(),
            updated_at: now,
            installed_version: None,
            source_url: None,
            tags: vec![],
        }
    }

    /// Check if this server is enabled for a specific client
    #[allow(dead_code)]
    pub fn is_enabled_for_client(&self, client_id: &str) -> bool {
        self.enabled && self.enabled_clients.contains(&client_id.to_string())
    }

    /// Enable this server for a specific client
    pub fn enable_for_client(&mut self, client_id: &str) {
        if !self.enabled_clients.contains(&client_id.to_string()) {
            self.enabled_clients.push(client_id.to_string());
            self.updated_at = chrono::Utc::now().to_rfc3339();
        }
    }

    /// Disable this server for a specific client
    pub fn disable_for_client(&mut self, client_id: &str) {
        self.enabled_clients.retain(|c| c != client_id);
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_creation() {
        let server = McpServer::new(
            "test-server".to_string(),
            ServerSource::Npm {
                package: "@modelcontextprotocol/server-filesystem".to_string(),
                version: Some("1.0.0".to_string()),
            },
            Transport::Stdio {
                command: "npx".to_string(),
                args: vec![
                    "-y".to_string(),
                    "@modelcontextprotocol/server-filesystem".to_string(),
                ],
                env: HashMap::new(),
            },
        );

        assert_eq!(server.name, "test-server");
        assert!(server.enabled);
        assert!(server.enabled_clients.is_empty());
    }

    #[test]
    fn test_client_enable_disable() {
        let mut server = McpServer::new(
            "test-server".to_string(),
            ServerSource::Local {
                path: "/path/to/server".to_string(),
            },
            Transport::Stdio {
                command: "node".to_string(),
                args: vec!["index.js".to_string()],
                env: HashMap::new(),
            },
        );

        // Enable for claude-code
        server.enable_for_client("claude-code");
        assert!(server.is_enabled_for_client("claude-code"));
        assert!(!server.is_enabled_for_client("cursor"));

        // Enable for cursor
        server.enable_for_client("cursor");
        assert!(server.is_enabled_for_client("cursor"));

        // Disable for claude-code
        server.disable_for_client("claude-code");
        assert!(!server.is_enabled_for_client("claude-code"));
        assert!(server.is_enabled_for_client("cursor"));
    }

    #[test]
    fn test_server_serialization() {
        let server = McpServer::new(
            "filesystem".to_string(),
            ServerSource::Npm {
                package: "@modelcontextprotocol/server-filesystem".to_string(),
                version: None,
            },
            Transport::Stdio {
                command: "npx".to_string(),
                args: vec![
                    "-y".to_string(),
                    "@modelcontextprotocol/server-filesystem".to_string(),
                    "/Users/josh/Documents".to_string(),
                ],
                env: HashMap::new(),
            },
        );

        let json = serde_json::to_string_pretty(&server).unwrap();
        let parsed: McpServer = serde_json::from_str(&json).unwrap();

        assert_eq!(server.name, parsed.name);
        assert_eq!(server.id, parsed.id);
    }

    #[test]
    fn test_sse_transport() {
        let server = McpServer::new(
            "remote-server".to_string(),
            ServerSource::Remote {
                url: "https://api.example.com/mcp".to_string(),
            },
            Transport::Sse {
                url: "https://api.example.com/mcp/sse".to_string(),
                headers: HashMap::from([("Authorization".to_string(), "Bearer token".to_string())]),
            },
        );

        let json = serde_json::to_string_pretty(&server).unwrap();
        assert!(json.contains("\"type\": \"sse\""));
        assert!(json.contains("\"url\": \"https://api.example.com/mcp/sse\""));
    }
}
