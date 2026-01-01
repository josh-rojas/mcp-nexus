// src-tauri/src/commands/updates.rs
//! Tauri commands for checking server updates.

use crate::commands::config::AppState;
use crate::services::{
    check_for_updates_detailed, check_npm_version, check_pypi_version, is_newer_version,
    ServerUpdate, UpdateCheckResult,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// Error type for update command responses
#[derive(Debug, Serialize)]
pub struct UpdateError {
    pub message: String,
    pub error_type: String,
}

impl From<crate::services::ConfigError> for UpdateError {
    fn from(err: crate::services::ConfigError) -> Self {
        UpdateError {
            message: err.to_string(),
            error_type: "config_error".to_string(),
        }
    }
}

/// Request to check a single package version
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckPackageVersionRequest {
    pub package_name: String,
    pub registry: String,
    pub installed_version: Option<String>,
}

/// Response for single package version check
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckPackageVersionResponse {
    pub package_name: String,
    pub installed_version: Option<String>,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub error: Option<String>,
}

/// Check for updates for all installed servers
///
/// This command queries npm/PyPI registries to compare installed versions
/// against the latest available versions.
#[tauri::command]
pub async fn check_for_updates(
    state: State<'_, Mutex<AppState>>,
) -> Result<UpdateCheckResult, UpdateError> {
    // Load servers from config
    let servers = {
        let state = state.lock().unwrap();
        state.config_manager.load()?.servers
    };

    // Check for updates
    let result = check_for_updates_detailed(&servers).await;

    Ok(result)
}

/// Check for updates for a single server by ID
#[tauri::command]
pub async fn check_server_update(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
) -> Result<Option<ServerUpdate>, UpdateError> {
    let uuid = uuid::Uuid::parse_str(&server_id).map_err(|e| UpdateError {
        message: format!("Invalid server ID: {}", e),
        error_type: "invalid_id".to_string(),
    })?;

    // Load the specific server
    let server = {
        let state = state.lock().unwrap();
        state.config_manager.get_server(&uuid)?
    };

    // Check based on source type
    let update = match &server.source {
        crate::models::ServerSource::Npm { package, .. } => {
            match check_npm_version(package).await {
                Ok(Some(latest_version)) => {
                    let update_available = server
                        .installed_version
                        .as_ref()
                        .map(|installed| is_newer_version(installed, &latest_version))
                        .unwrap_or(true);

                    Some(ServerUpdate {
                        server_id: server.id.to_string(),
                        server_name: server.name.clone(),
                        installed_version: server.installed_version.clone(),
                        latest_version: Some(latest_version),
                        update_available,
                        package_name: Some(package.clone()),
                        package_registry: Some("npm".to_string()),
                        source_url: server.source_url.clone(),
                    })
                }
                Ok(None) => None,
                Err(_) => None,
            }
        }
        crate::models::ServerSource::Uvx { package } => {
            match check_pypi_version(package).await {
                Ok(Some(latest_version)) => {
                    let update_available = server
                        .installed_version
                        .as_ref()
                        .map(|installed| is_newer_version(installed, &latest_version))
                        .unwrap_or(true);

                    Some(ServerUpdate {
                        server_id: server.id.to_string(),
                        server_name: server.name.clone(),
                        installed_version: server.installed_version.clone(),
                        latest_version: Some(latest_version),
                        update_available,
                        package_name: Some(package.clone()),
                        package_registry: Some("pypi".to_string()),
                        source_url: server.source_url.clone(),
                    })
                }
                Ok(None) => None,
                Err(_) => None,
            }
        }
        _ => None, // Can't check updates for other source types
    };

    Ok(update)
}

/// Check the latest version for a specific package
///
/// This is useful for checking before installation or for UI displays.
#[tauri::command]
pub async fn check_package_version(
    request: CheckPackageVersionRequest,
) -> Result<CheckPackageVersionResponse, UpdateError> {
    let result = match request.registry.to_lowercase().as_str() {
        "npm" => {
            match check_npm_version(&request.package_name).await {
                Ok(Some(latest_version)) => {
                    let update_available = request
                        .installed_version
                        .as_ref()
                        .map(|installed| is_newer_version(installed, &latest_version))
                        .unwrap_or(false);

                    CheckPackageVersionResponse {
                        package_name: request.package_name,
                        installed_version: request.installed_version,
                        latest_version: Some(latest_version),
                        update_available,
                        error: None,
                    }
                }
                Ok(None) => CheckPackageVersionResponse {
                    package_name: request.package_name,
                    installed_version: request.installed_version,
                    latest_version: None,
                    update_available: false,
                    error: Some("Package not found".to_string()),
                },
                Err(e) => CheckPackageVersionResponse {
                    package_name: request.package_name,
                    installed_version: request.installed_version,
                    latest_version: None,
                    update_available: false,
                    error: Some(e),
                },
            }
        }
        "pypi" => {
            match check_pypi_version(&request.package_name).await {
                Ok(Some(latest_version)) => {
                    let update_available = request
                        .installed_version
                        .as_ref()
                        .map(|installed| is_newer_version(installed, &latest_version))
                        .unwrap_or(false);

                    CheckPackageVersionResponse {
                        package_name: request.package_name,
                        installed_version: request.installed_version,
                        latest_version: Some(latest_version),
                        update_available,
                        error: None,
                    }
                }
                Ok(None) => CheckPackageVersionResponse {
                    package_name: request.package_name,
                    installed_version: request.installed_version,
                    latest_version: None,
                    update_available: false,
                    error: Some("Package not found".to_string()),
                },
                Err(e) => CheckPackageVersionResponse {
                    package_name: request.package_name,
                    installed_version: request.installed_version,
                    latest_version: None,
                    update_available: false,
                    error: Some(e),
                },
            }
        }
        _ => CheckPackageVersionResponse {
            package_name: request.package_name,
            installed_version: request.installed_version,
            latest_version: None,
            update_available: false,
            error: Some(format!("Unsupported registry: {}", request.registry)),
        },
    };

    Ok(result)
}

/// Get the count of servers with available updates
///
/// This is a quick check useful for dashboard badges.
#[tauri::command]
pub async fn get_update_count(
    state: State<'_, Mutex<AppState>>,
) -> Result<usize, UpdateError> {
    let servers = {
        let state = state.lock().unwrap();
        state.config_manager.load()?.servers
    };

    let result = check_for_updates_detailed(&servers).await;
    Ok(result.updates_available)
}
