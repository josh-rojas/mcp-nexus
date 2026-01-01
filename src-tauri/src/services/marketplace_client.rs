use crate::models::{
    CachedResponse, FilterOptions, MarketplaceError, MarketplaceSearchResponse, MarketplaceServer,
    SearchParams, SortOption,
};
use reqwest::Client;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Base URL for the PulseMCP API
const PULSEMCP_API_BASE: &str = "https://api.pulsemcp.com/v0beta";

/// Default cache TTL in seconds (5 minutes)
const DEFAULT_CACHE_TTL_SECONDS: u64 = 300;

/// Maximum page size allowed by the API
const MAX_PAGE_SIZE: u32 = 5000;

/// Default page size for UI
const DEFAULT_PAGE_SIZE: u32 = 42;

/// Client for interacting with the PulseMCP marketplace API
#[derive(Debug)]
pub struct MarketplaceClient {
    /// HTTP client for making requests
    http_client: Client,
    /// In-memory cache for search results
    cache: Arc<RwLock<HashMap<String, CachedResponse>>>,
    /// Cache TTL in seconds
    cache_ttl_seconds: u64,
}

impl Default for MarketplaceClient {
    fn default() -> Self {
        Self::new()
    }
}

impl MarketplaceClient {
    /// Create a new marketplace client with default settings
    pub fn new() -> Self {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("mcp-manager/0.1.0")
            .build()
            .expect("Failed to create HTTP client");

        Self {
            http_client,
            cache: Arc::new(RwLock::new(HashMap::new())),
            cache_ttl_seconds: DEFAULT_CACHE_TTL_SECONDS,
        }
    }

    /// Create a new marketplace client with custom cache TTL
    #[allow(dead_code)]
    pub fn with_cache_ttl(cache_ttl_seconds: u64) -> Self {
        let mut client = Self::new();
        client.cache_ttl_seconds = cache_ttl_seconds;
        client
    }

    /// Generate a cache key from search parameters
    fn cache_key(params: &SearchParams) -> String {
        format!(
            "search:{}:{}:{}",
            params.query.as_deref().unwrap_or(""),
            params.count_per_page.unwrap_or(DEFAULT_PAGE_SIZE),
            params.offset.unwrap_or(0)
        )
    }

    /// Search for servers in the marketplace
    pub async fn search_servers(
        &self,
        params: SearchParams,
    ) -> Result<MarketplaceSearchResponse, MarketplaceError> {
        let cache_key = Self::cache_key(&params);

        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(cached) = cache.get(&cache_key) {
                if cached.is_valid(self.cache_ttl_seconds) {
                    return Ok(cached.data.clone());
                }
            }
        }

        // Build the API URL
        let mut url = format!("{}/servers", PULSEMCP_API_BASE);
        let mut query_parts = Vec::new();

        if let Some(ref query) = params.query {
            if !query.is_empty() {
                query_parts.push(format!("query={}", urlencoding::encode(query)));
            }
        }

        let page_size = params.count_per_page.unwrap_or(DEFAULT_PAGE_SIZE).min(MAX_PAGE_SIZE);
        query_parts.push(format!("count_per_page={}", page_size));

        if let Some(offset) = params.offset {
            query_parts.push(format!("offset={}", offset));
        }

        if !query_parts.is_empty() {
            url = format!("{}?{}", url, query_parts.join("&"));
        }

        // Make the request
        let response = self
            .http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| MarketplaceError::NetworkError {
                message: e.to_string(),
            })?;

        // Handle different HTTP status codes
        let status = response.status();
        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok());

            // Return cached data if available, even if stale
            {
                let cache = self.cache.read().await;
                if let Some(cached) = cache.get(&cache_key) {
                    return Ok(cached.data.clone());
                }
            }

            return Err(MarketplaceError::RateLimitExceeded {
                retry_after_seconds: retry_after,
            });
        }

        if status == reqwest::StatusCode::BAD_REQUEST {
            let error_text = response.text().await.unwrap_or_default();
            return Err(MarketplaceError::InvalidRequest {
                message: error_text,
            });
        }

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();

            // Return cached data if available, even if stale
            {
                let cache = self.cache.read().await;
                if let Some(cached) = cache.get(&cache_key) {
                    return Ok(cached.data.clone());
                }
            }

            return Err(MarketplaceError::ApiError {
                code: status.as_u16(),
                message: error_text,
            });
        }

        // Parse the response
        let mut data: MarketplaceSearchResponse =
            response
                .json()
                .await
                .map_err(|e| MarketplaceError::ParseError {
                    message: e.to_string(),
                })?;

        // Apply client-side filters if specified
        if let Some(ref filters) = params.filters {
            data.servers = Self::apply_filters(data.servers, filters);
        }

        // Apply client-side sorting if specified
        if let Some(sort) = params.sort {
            data.servers = Self::apply_sort(data.servers, sort);
        }

        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.insert(
                cache_key,
                CachedResponse {
                    data: data.clone(),
                    cached_at: Instant::now(),
                },
            );
        }

        Ok(data)
    }

    /// Apply filter options to a list of servers (client-side filtering)
    fn apply_filters(servers: Vec<MarketplaceServer>, filters: &FilterOptions) -> Vec<MarketplaceServer> {
        servers
            .into_iter()
            .filter(|server| {
                // Filter for remote available
                if filters.remote_available && server.remotes.is_empty() {
                    return false;
                }

                // Filter for official (has package registry)
                if filters.official && server.package_registry.is_none() {
                    return false;
                }

                // All filters passed
                true
            })
            .collect()
    }

    /// Apply sort option to a list of servers (client-side sorting)
    fn apply_sort(mut servers: Vec<MarketplaceServer>, sort: SortOption) -> Vec<MarketplaceServer> {
        match sort {
            SortOption::Alphabetical => {
                servers.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
            }
            SortOption::PopularAll | SortOption::PopularMonth | SortOption::PopularWeek => {
                // Sort by GitHub stars as a proxy for popularity
                servers.sort_by(|a, b| {
                    b.github_stars.unwrap_or(0).cmp(&a.github_stars.unwrap_or(0))
                });
            }
            _ => {
                // Default: keep API order (Recommended/LastUpdated)
            }
        }
        servers
    }

    /// Get details for a specific server by name
    /// Since PulseMCP doesn't have a dedicated endpoint, we search and find the match
    pub async fn get_server_details(
        &self,
        name: &str,
    ) -> Result<Option<MarketplaceServer>, MarketplaceError> {
        // Search with the exact name
        let params = SearchParams::with_query(name).page_size(50);
        let response = self.search_servers(params).await?;

        // Find the server with matching name (case-insensitive)
        let server = response
            .servers
            .into_iter()
            .find(|s| s.name.to_lowercase() == name.to_lowercase());

        Ok(server)
    }

    /// Clear the cache (useful for manual refresh)
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }

    /// Get cached data for a query, if available
    pub async fn get_cached(
        &self,
        params: &SearchParams,
    ) -> Option<MarketplaceSearchResponse> {
        let cache_key = Self::cache_key(params);
        let cache = self.cache.read().await;
        cache
            .get(&cache_key)
            .filter(|cached| cached.is_valid(self.cache_ttl_seconds))
            .map(|cached| cached.data.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        let params = SearchParams::with_query("filesystem").page_size(20).offset(40);
        let key = MarketplaceClient::cache_key(&params);
        assert_eq!(key, "search:filesystem:20:40");
    }

    #[test]
    fn test_cache_key_empty_query() {
        let params = SearchParams::default().page_size(42);
        let key = MarketplaceClient::cache_key(&params);
        assert_eq!(key, "search::42:0");
    }

    #[test]
    fn test_apply_filters_remote_available() {
        let servers = vec![
            MarketplaceServer {
                name: "Server A".to_string(),
                url: "https://example.com/a".to_string(),
                external_url: None,
                short_description: "Test".to_string(),
                source_code_url: None,
                github_stars: None,
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![],
            },
            MarketplaceServer {
                name: "Server B".to_string(),
                url: "https://example.com/b".to_string(),
                external_url: None,
                short_description: "Test".to_string(),
                source_code_url: None,
                github_stars: None,
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![crate::models::RemoteEndpoint {
                    remote_type: Some("sse".to_string()),
                    url: Some("https://api.example.com/mcp".to_string()),
                }],
            },
        ];

        let filters = FilterOptions {
            remote_available: true,
            ..Default::default()
        };

        let filtered = MarketplaceClient::apply_filters(servers, &filters);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].name, "Server B");
    }

    #[test]
    fn test_apply_sort_alphabetical() {
        let servers = vec![
            MarketplaceServer {
                name: "Zebra".to_string(),
                url: "".to_string(),
                external_url: None,
                short_description: "".to_string(),
                source_code_url: None,
                github_stars: None,
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![],
            },
            MarketplaceServer {
                name: "Alpha".to_string(),
                url: "".to_string(),
                external_url: None,
                short_description: "".to_string(),
                source_code_url: None,
                github_stars: None,
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![],
            },
        ];

        let sorted = MarketplaceClient::apply_sort(servers, SortOption::Alphabetical);
        assert_eq!(sorted[0].name, "Alpha");
        assert_eq!(sorted[1].name, "Zebra");
    }

    #[test]
    fn test_apply_sort_popular() {
        let servers = vec![
            MarketplaceServer {
                name: "Low Stars".to_string(),
                url: "".to_string(),
                external_url: None,
                short_description: "".to_string(),
                source_code_url: None,
                github_stars: Some(10),
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![],
            },
            MarketplaceServer {
                name: "High Stars".to_string(),
                url: "".to_string(),
                external_url: None,
                short_description: "".to_string(),
                source_code_url: None,
                github_stars: Some(1000),
                package_registry: None,
                package_name: None,
                package_download_count: None,
                ai_description: None,
                remotes: vec![],
            },
        ];

        let sorted = MarketplaceClient::apply_sort(servers, SortOption::PopularAll);
        assert_eq!(sorted[0].name, "High Stars");
        assert_eq!(sorted[1].name, "Low Stars");
    }
}
