use crate::models::{FilterOptions, MarketplaceError, MarketplaceServer, SearchParams, SortOption};
use crate::services::MarketplaceClient;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Marketplace state holding the API client
pub struct MarketplaceState {
    pub client: MarketplaceClient,
}

/// Error response for marketplace commands
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketplaceCommandError {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after_seconds: Option<u64>,
}

impl From<MarketplaceError> for MarketplaceCommandError {
    fn from(err: MarketplaceError) -> Self {
        match err {
            MarketplaceError::NetworkError { message } => MarketplaceCommandError {
                message,
                error_type: Some("network".to_string()),
                retry_after_seconds: None,
            },
            MarketplaceError::RateLimitExceeded { retry_after_seconds } => {
                MarketplaceCommandError {
                    message: "Rate limit exceeded. Please try again later.".to_string(),
                    error_type: Some("rate_limit".to_string()),
                    retry_after_seconds,
                }
            }
            MarketplaceError::InvalidRequest { message } => MarketplaceCommandError {
                message,
                error_type: Some("invalid_request".to_string()),
                retry_after_seconds: None,
            },
            MarketplaceError::ApiError { code, message } => MarketplaceCommandError {
                message: format!("API error ({}): {}", code, message),
                error_type: Some("api_error".to_string()),
                retry_after_seconds: None,
            },
            MarketplaceError::ParseError { message } => MarketplaceCommandError {
                message,
                error_type: Some("parse_error".to_string()),
                retry_after_seconds: None,
            },
        }
    }
}

/// Search parameters from the frontend
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchServersParams {
    /// Search query text
    #[serde(default)]
    pub query: Option<String>,
    /// Number of results per page
    #[serde(default)]
    pub page_size: Option<u32>,
    /// Page number (0-indexed)
    #[serde(default)]
    pub page: Option<u32>,
    /// Sort option
    #[serde(default)]
    pub sort: Option<SortOption>,
    /// Filter for official servers only
    #[serde(default)]
    pub official_only: bool,
    /// Filter for community servers only
    #[serde(default)]
    pub community_only: bool,
    /// Filter for servers with remote/SSE support
    #[serde(default)]
    pub remote_available: bool,
}

impl From<SearchServersParams> for SearchParams {
    fn from(params: SearchServersParams) -> Self {
        let page_size = params.page_size.unwrap_or(42);
        let offset = params.page.unwrap_or(0) * page_size;

        let filters = if params.official_only || params.community_only || params.remote_available {
            Some(FilterOptions {
                official: params.official_only,
                community: params.community_only,
                remote_available: params.remote_available,
                anthropic_references: false,
            })
        } else {
            None
        };

        SearchParams {
            query: params.query,
            count_per_page: Some(page_size),
            offset: Some(offset),
            sort: params.sort,
            filters,
        }
    }
}

/// Search result response for the frontend
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    /// List of servers matching the query
    pub servers: Vec<MarketplaceServer>,
    /// Total count of matching servers
    pub total_count: u32,
    /// Whether there are more pages
    pub has_more: bool,
    /// Current page number
    pub page: u32,
    /// Page size used
    pub page_size: u32,
}

/// Search for servers in the PulseMCP marketplace
#[tauri::command]
pub async fn search_servers(
    state: State<'_, Arc<RwLock<MarketplaceState>>>,
    params: SearchServersParams,
) -> Result<SearchResult, MarketplaceCommandError> {
    let page = params.page.unwrap_or(0);
    let page_size = params.page_size.unwrap_or(42);

    let marketplace_state = state.read().await;
    let search_params: SearchParams = params.into();
    let response = marketplace_state
        .client
        .search_servers(search_params)
        .await?;

    let has_more = response.next.is_some()
        || ((page + 1) * page_size) < response.total_count;

    Ok(SearchResult {
        servers: response.servers,
        total_count: response.total_count,
        has_more,
        page,
        page_size,
    })
}

/// Get details for a specific server by name
#[tauri::command]
pub async fn get_server_details(
    state: State<'_, Arc<RwLock<MarketplaceState>>>,
    name: String,
) -> Result<Option<MarketplaceServer>, MarketplaceCommandError> {
    let marketplace_state = state.read().await;
    marketplace_state
        .client
        .get_server_details(&name)
        .await
        .map_err(Into::into)
}

/// Clear the marketplace cache (for manual refresh)
#[tauri::command]
pub async fn clear_marketplace_cache(
    state: State<'_, Arc<RwLock<MarketplaceState>>>,
) -> Result<(), MarketplaceCommandError> {
    let marketplace_state = state.read().await;
    marketplace_state.client.clear_cache().await;
    Ok(())
}

/// Check if we have cached data for a search query (useful for offline mode)
#[tauri::command]
pub async fn check_marketplace_cache(
    state: State<'_, Arc<RwLock<MarketplaceState>>>,
    params: SearchServersParams,
) -> Result<bool, MarketplaceCommandError> {
    let marketplace_state = state.read().await;
    let search_params: SearchParams = params.into();
    let cached = marketplace_state.client.get_cached(&search_params).await;
    Ok(cached.is_some())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_params_conversion() {
        let params = SearchServersParams {
            query: Some("filesystem".to_string()),
            page_size: Some(20),
            page: Some(2),
            sort: Some(SortOption::Alphabetical),
            official_only: false,
            community_only: false,
            remote_available: false,
        };

        let search_params: SearchParams = params.into();
        assert_eq!(search_params.query.as_deref(), Some("filesystem"));
        assert_eq!(search_params.count_per_page, Some(20));
        assert_eq!(search_params.offset, Some(40)); // page 2 * 20 per page
        assert_eq!(search_params.sort, Some(SortOption::Alphabetical));
        assert!(search_params.filters.is_none());
    }

    #[test]
    fn test_search_params_with_filters() {
        let params = SearchServersParams {
            query: None,
            page_size: None,
            page: None,
            sort: None,
            official_only: true,
            community_only: false,
            remote_available: true,
        };

        let search_params: SearchParams = params.into();
        assert!(search_params.filters.is_some());

        let filters = search_params.filters.unwrap();
        assert!(filters.official);
        assert!(!filters.community);
        assert!(filters.remote_available);
    }
}
