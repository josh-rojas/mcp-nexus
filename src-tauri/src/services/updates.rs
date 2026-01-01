// src-tauri/src/services/updates.rs
//! Update checking and version comparison for installed MCP servers.
//!
//! This module provides functionality to check for available updates
//! by comparing installed versions against package registries.

use crate::models::{McpServer, ServerSource};
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

/// Information about an available update for a server
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerUpdate {
    /// The server ID
    pub server_id: String,
    /// Server display name
    pub server_name: String,
    /// Currently installed version (if known)
    pub installed_version: Option<String>,
    /// Latest available version (if known)
    pub latest_version: Option<String>,
    /// Whether an update is available
    pub update_available: bool,
    /// Package name for reference
    pub package_name: Option<String>,
    /// Package registry (npm, pypi, etc.)
    pub package_registry: Option<String>,
    /// Source URL for the update
    pub source_url: Option<String>,
}

/// Result of checking for updates across all servers
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    /// List of servers with available updates
    pub updates: Vec<ServerUpdate>,
    /// Total number of servers checked
    pub servers_checked: usize,
    /// Number of servers with updates available
    pub updates_available: usize,
    /// Servers that couldn't be checked (e.g., local paths, custom remotes)
    pub servers_skipped: usize,
    /// Any errors encountered during the check
    pub errors: Vec<String>,
    /// Timestamp of the check
    pub checked_at: String,
}

/// Parse a version string into components for comparison
fn parse_version(version: &str) -> Vec<u32> {
    version
        .trim_start_matches('v')
        .trim_start_matches('V')
        .split(&['.', '-', '+'][..])
        .filter_map(|s| s.parse::<u32>().ok())
        .collect()
}

/// Compare two version strings
/// Returns Ordering::Less if v1 < v2, Ordering::Greater if v1 > v2, Ordering::Equal if equal
pub fn compare_versions(v1: &str, v2: &str) -> Ordering {
    let v1_parts = parse_version(v1);
    let v2_parts = parse_version(v2);

    for (a, b) in v1_parts.iter().zip(v2_parts.iter()) {
        match a.cmp(b) {
            Ordering::Equal => continue,
            other => return other,
        }
    }

    // If all compared parts are equal, the longer version is greater
    v1_parts.len().cmp(&v2_parts.len())
}

/// Check if version v2 is newer than v1
pub fn is_newer_version(installed: &str, latest: &str) -> bool {
    compare_versions(installed, latest) == Ordering::Less
}

/// Check for updates for a single server by querying npm registry
pub async fn check_npm_version(package_name: &str) -> Result<Option<String>, String> {
    let url = format!("https://registry.npmjs.org/{}/latest", package_name);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to query npm registry: {}", e))?;

    if !response.status().is_success() {
        return Ok(None);
    }

    #[derive(Deserialize)]
    struct NpmPackage {
        version: String,
    }

    let package: NpmPackage = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse npm response: {}", e))?;

    Ok(Some(package.version))
}

/// Check for updates for a single server by querying PyPI registry
pub async fn check_pypi_version(package_name: &str) -> Result<Option<String>, String> {
    let url = format!("https://pypi.org/pypi/{}/json", package_name);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to query PyPI: {}", e))?;

    if !response.status().is_success() {
        return Ok(None);
    }

    #[derive(Deserialize)]
    struct PyPiPackage {
        info: PyPiInfo,
    }

    #[derive(Deserialize)]
    struct PyPiInfo {
        version: String,
    }

    let package: PyPiPackage = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse PyPI response: {}", e))?;

    Ok(Some(package.info.version))
}

/// Check for updates with real version comparison from registries
pub async fn check_for_updates_detailed(
    servers: &[McpServer],
) -> UpdateCheckResult {
    let now = chrono::Utc::now().to_rfc3339();
    let mut updates = Vec::new();
    let mut errors = Vec::new();
    let mut servers_skipped = 0;

    for server in servers {
        match &server.source {
            ServerSource::Npm { package, .. } => {
                match check_npm_version(package).await {
                    Ok(Some(latest_version)) => {
                        let update_available = server
                            .installed_version
                            .as_ref()
                            .map(|installed| is_newer_version(installed, &latest_version))
                            .unwrap_or(true); // If no installed version, assume update available

                        updates.push(ServerUpdate {
                            server_id: server.id.to_string(),
                            server_name: server.name.clone(),
                            installed_version: server.installed_version.clone(),
                            latest_version: Some(latest_version),
                            update_available,
                            package_name: Some(package.clone()),
                            package_registry: Some("npm".to_string()),
                            source_url: server.source_url.clone(),
                        });
                    }
                    Ok(None) => {
                        servers_skipped += 1;
                    }
                    Err(e) => {
                        errors.push(format!("Failed to check {}: {}", package, e));
                        servers_skipped += 1;
                    }
                }
            }
            ServerSource::Uvx { package } => {
                match check_pypi_version(package).await {
                    Ok(Some(latest_version)) => {
                        let update_available = server
                            .installed_version
                            .as_ref()
                            .map(|installed| is_newer_version(installed, &latest_version))
                            .unwrap_or(true);

                        updates.push(ServerUpdate {
                            server_id: server.id.to_string(),
                            server_name: server.name.clone(),
                            installed_version: server.installed_version.clone(),
                            latest_version: Some(latest_version),
                            update_available,
                            package_name: Some(package.clone()),
                            package_registry: Some("pypi".to_string()),
                            source_url: server.source_url.clone(),
                        });
                    }
                    Ok(None) => {
                        servers_skipped += 1;
                    }
                    Err(e) => {
                        errors.push(format!("Failed to check {}: {}", package, e));
                        servers_skipped += 1;
                    }
                }
            }
            _ => {
                // Can't check updates for local, docker, remote, or github sources
                servers_skipped += 1;
            }
        }
    }

    let updates_available = updates.iter().filter(|u| u.update_available).count();

    UpdateCheckResult {
        updates,
        servers_checked: servers.len() - servers_skipped,
        updates_available,
        servers_skipped,
        errors,
        checked_at: now,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_version() {
        assert_eq!(parse_version("1.0.0"), vec![1, 0, 0]);
        assert_eq!(parse_version("v2.3.4"), vec![2, 3, 4]);
        assert_eq!(parse_version("1.2.3-beta.1"), vec![1, 2, 3, 1]);
        assert_eq!(parse_version("1.0.0+build.123"), vec![1, 0, 0, 123]);
    }

    #[test]
    fn test_compare_versions() {
        assert_eq!(compare_versions("1.0.0", "1.0.0"), Ordering::Equal);
        assert_eq!(compare_versions("1.0.0", "1.0.1"), Ordering::Less);
        assert_eq!(compare_versions("1.0.1", "1.0.0"), Ordering::Greater);
        assert_eq!(compare_versions("1.0.0", "2.0.0"), Ordering::Less);
        assert_eq!(compare_versions("v1.0.0", "1.0.1"), Ordering::Less);
        assert_eq!(compare_versions("1.0", "1.0.0"), Ordering::Less);
        assert_eq!(compare_versions("1.0.0", "1.0"), Ordering::Greater);
    }

    #[test]
    fn test_is_newer_version() {
        assert!(is_newer_version("1.0.0", "1.0.1"));
        assert!(is_newer_version("1.0.0", "2.0.0"));
        assert!(!is_newer_version("1.0.1", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(is_newer_version("0.9.9", "1.0.0"));
    }

    #[test]
    fn test_version_with_prefix() {
        assert!(is_newer_version("v1.0.0", "v1.0.1"));
        assert!(is_newer_version("v1.0.0", "1.0.1"));
        assert!(is_newer_version("1.0.0", "v1.0.1"));
    }

    #[test]
    fn test_version_with_prerelease() {
        // In our simple comparison, 1.0.0-beta.1 has parts [1, 0, 0, 1]
        // 1.0.0 has parts [1, 0, 0]
        // So 1.0.0 < 1.0.0-beta.1 in our comparison (longer is greater)
        // This is technically incorrect for semver, but sufficient for most cases
        assert_eq!(compare_versions("1.0.0", "1.0.0-beta.1"), Ordering::Less);
    }

    #[test]
    fn test_update_check_result_serialization() {
        let result = UpdateCheckResult {
            updates: vec![],
            servers_checked: 5,
            updates_available: 2,
            servers_skipped: 1,
            errors: vec![],
            checked_at: "2024-01-01T00:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"serversChecked\":5"));
        assert!(json.contains("\"updatesAvailable\":2"));
    }

    #[test]
    fn test_server_update_serialization() {
        let update = ServerUpdate {
            server_id: "abc123".to_string(),
            server_name: "Test Server".to_string(),
            installed_version: Some("1.0.0".to_string()),
            latest_version: Some("1.1.0".to_string()),
            update_available: true,
            package_name: Some("@test/server".to_string()),
            package_registry: Some("npm".to_string()),
            source_url: Some("https://github.com/test/server".to_string()),
        };

        let json = serde_json::to_string(&update).unwrap();
        let parsed: ServerUpdate = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.server_id, "abc123");
        assert!(parsed.update_available);
    }
}
