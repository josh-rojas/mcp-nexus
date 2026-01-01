use serde::{Deserialize, Serialize};

/// Response from the PulseMCP API's /servers endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceSearchResponse {
    /// List of servers matching the search criteria
    pub servers: Vec<MarketplaceServer>,
    /// Total count of servers matching the query
    pub total_count: u32,
    /// URL for the next page of results (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<String>,
}

/// Represents a server from the PulseMCP marketplace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceServer {
    /// Server display name
    pub name: String,
    /// PulseMCP directory URL for the server
    pub url: String,
    /// External URL (website, docs, etc.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external_url: Option<String>,
    /// Brief description of the server
    pub short_description: String,
    /// Source code repository URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_code_url: Option<String>,
    /// GitHub star count
    #[serde(skip_serializing_if = "Option::is_none")]
    pub github_stars: Option<u32>,
    /// Package registry (npm, pypi, etc.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_registry: Option<String>,
    /// Package name in the registry
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_name: Option<String>,
    /// Download count from the package registry
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_download_count: Option<u64>,
    /// AI-generated description (experimental field from PulseMCP)
    #[serde(
        rename = "EXPERIMENTAL_ai_generated_description",
        skip_serializing_if = "Option::is_none"
    )]
    pub ai_description: Option<String>,
    /// Remote endpoints for SSE-based servers
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub remotes: Vec<RemoteEndpoint>,
}

/// Remote endpoint for SSE-based servers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteEndpoint {
    /// Type of remote (usually "sse")
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub remote_type: Option<String>,
    /// URL of the remote endpoint
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

/// Sort options for marketplace search
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum SortOption {
    /// Sort by last updated date (most recent first)
    #[default]
    LastUpdated,
    /// Sort alphabetically A-Z
    Alphabetical,
    /// Sort by popularity this week
    PopularWeek,
    /// Sort by popularity this month
    PopularMonth,
    /// Sort by popularity all time
    PopularAll,
    /// Recommended (default from API)
    Recommended,
    /// Recently released
    RecentlyReleased,
}

/// Filter options for marketplace search
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FilterOptions {
    /// Include only official provider servers
    #[serde(default)]
    pub official: bool,
    /// Include only community servers
    #[serde(default)]
    pub community: bool,
    /// Include only servers with remote/SSE support
    #[serde(default)]
    pub remote_available: bool,
    /// Include only Anthropic reference servers
    #[serde(default)]
    pub anthropic_references: bool,
}

/// Search parameters for marketplace queries
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SearchParams {
    /// Search query text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query: Option<String>,
    /// Number of results per page (max 5000)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub count_per_page: Option<u32>,
    /// Offset for pagination
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<u32>,
    /// Sort option
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort: Option<SortOption>,
    /// Filter options
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filters: Option<FilterOptions>,
}

impl SearchParams {
    /// Create a new search params with just a query
    pub fn with_query(query: impl Into<String>) -> Self {
        Self {
            query: Some(query.into()),
            count_per_page: Some(42), // Default page size from PulseMCP UI
            ..Default::default()
        }
    }

    /// Set the page size
    pub fn page_size(mut self, count: u32) -> Self {
        self.count_per_page = Some(count.min(5000));
        self
    }

    /// Set the offset for pagination
    #[allow(dead_code)]
    pub fn offset(mut self, offset: u32) -> Self {
        self.offset = Some(offset);
        self
    }
}

/// Cached marketplace data with TTL
#[derive(Debug, Clone)]
pub struct CachedResponse {
    /// The cached response data
    pub data: MarketplaceSearchResponse,
    /// When this cache entry was created
    pub cached_at: std::time::Instant,
}

impl CachedResponse {
    /// Check if the cache entry is still valid (within TTL)
    pub fn is_valid(&self, ttl_seconds: u64) -> bool {
        self.cached_at.elapsed().as_secs() < ttl_seconds
    }
}

/// Error types for marketplace operations
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum MarketplaceError {
    /// Network error (API unreachable)
    NetworkError { message: String },
    /// Rate limit exceeded
    RateLimitExceeded { retry_after_seconds: Option<u64> },
    /// Invalid request parameters
    InvalidRequest { message: String },
    /// API returned an error
    ApiError { code: u16, message: String },
    /// Parse error for response
    ParseError { message: String },
}

impl std::fmt::Display for MarketplaceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MarketplaceError::NetworkError { message } => {
                write!(f, "Network error: {}", message)
            }
            MarketplaceError::RateLimitExceeded { retry_after_seconds } => {
                if let Some(seconds) = retry_after_seconds {
                    write!(f, "Rate limit exceeded. Retry after {} seconds", seconds)
                } else {
                    write!(f, "Rate limit exceeded")
                }
            }
            MarketplaceError::InvalidRequest { message } => {
                write!(f, "Invalid request: {}", message)
            }
            MarketplaceError::ApiError { code, message } => {
                write!(f, "API error ({}): {}", code, message)
            }
            MarketplaceError::ParseError { message } => {
                write!(f, "Parse error: {}", message)
            }
        }
    }
}

impl std::error::Error for MarketplaceError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_marketplace_response() {
        let json = r#"{
            "servers": [
                {
                    "name": "Filesystem",
                    "url": "https://www.pulsemcp.com/servers/filesystem",
                    "external_url": null,
                    "short_description": "Access and manage local filesystem",
                    "source_code_url": "https://github.com/modelcontextprotocol/servers",
                    "github_stars": 1500,
                    "package_registry": "npm",
                    "package_name": "@modelcontextprotocol/server-filesystem",
                    "package_download_count": 50000,
                    "EXPERIMENTAL_ai_generated_description": "A server for filesystem operations",
                    "remotes": []
                }
            ],
            "total_count": 1,
            "next": null
        }"#;

        let response: MarketplaceSearchResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.servers.len(), 1);
        assert_eq!(response.total_count, 1);
        assert!(response.next.is_none());

        let server = &response.servers[0];
        assert_eq!(server.name, "Filesystem");
        assert_eq!(server.package_registry.as_deref(), Some("npm"));
        assert_eq!(server.github_stars, Some(1500));
    }

    #[test]
    fn test_parse_server_with_remotes() {
        let json = r#"{
            "name": "Remote Server",
            "url": "https://www.pulsemcp.com/servers/remote",
            "external_url": "https://example.com",
            "short_description": "A remote SSE server",
            "source_code_url": null,
            "github_stars": null,
            "package_registry": null,
            "package_name": null,
            "package_download_count": null,
            "EXPERIMENTAL_ai_generated_description": null,
            "remotes": [
                {
                    "type": "sse",
                    "url": "https://api.example.com/mcp/sse"
                }
            ]
        }"#;

        let server: MarketplaceServer = serde_json::from_str(json).unwrap();
        assert_eq!(server.name, "Remote Server");
        assert_eq!(server.remotes.len(), 1);
        assert_eq!(server.remotes[0].remote_type.as_deref(), Some("sse"));
        assert_eq!(
            server.remotes[0].url.as_deref(),
            Some("https://api.example.com/mcp/sse")
        );
    }

    #[test]
    fn test_search_params_builder() {
        let params = SearchParams::with_query("filesystem").page_size(20).offset(40);

        assert_eq!(params.query.as_deref(), Some("filesystem"));
        assert_eq!(params.count_per_page, Some(20));
        assert_eq!(params.offset, Some(40));
    }

    #[test]
    fn test_page_size_capped_at_max() {
        let params = SearchParams::default().page_size(10000);
        assert_eq!(params.count_per_page, Some(5000)); // Max is 5000
    }

    #[test]
    fn test_marketplace_error_display() {
        let error = MarketplaceError::NetworkError {
            message: "Connection refused".to_string(),
        };
        assert!(error.to_string().contains("Connection refused"));

        let rate_limit = MarketplaceError::RateLimitExceeded {
            retry_after_seconds: Some(60),
        };
        assert!(rate_limit.to_string().contains("60 seconds"));
    }

    #[test]
    fn test_cached_response_validity() {
        let data = MarketplaceSearchResponse {
            servers: vec![],
            total_count: 0,
            next: None,
        };

        let cached = CachedResponse {
            data,
            cached_at: std::time::Instant::now(),
        };

        // Should be valid immediately
        assert!(cached.is_valid(300)); // 5 minute TTL
    }
}
