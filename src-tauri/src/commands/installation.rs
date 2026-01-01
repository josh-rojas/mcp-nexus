use crate::commands::config::AppState;
use crate::services::{
    cleanup_server as do_cleanup, install_server as do_install, run_doctor, validate_runtime,
    InstallResult, InstallServerRequest, InstallSource,
};
use crate::services::sync_engine::{sync_to_all_clients, SyncResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// Error type for installation command responses
#[derive(Debug, Serialize)]
pub struct InstallError {
    pub message: String,
    pub error_type: String,
}

impl From<crate::services::InstallationError> for InstallError {
    fn from(err: crate::services::InstallationError) -> Self {
        let error_type = match &err {
            crate::services::InstallationError::MissingRuntime(_, _) => "missing_runtime",
            crate::services::InstallationError::InvalidLocalPath(_) => "invalid_path",
            crate::services::InstallationError::GitCloneError(_) => "git_error",
            crate::services::InstallationError::SetupError(_) => "setup_error",
            crate::services::InstallationError::DockerError(_) => "docker_error",
            crate::services::InstallationError::InvalidUrl(_) => "invalid_url",
            crate::services::InstallationError::IoError(_) => "io_error",
            crate::services::InstallationError::HomeNotFound => "home_not_found",
            crate::services::InstallationError::ParseError(_) => "parse_error",
        };

        InstallError {
            message: err.to_string(),
            error_type: error_type.to_string(),
        }
    }
}

impl From<crate::services::ConfigError> for InstallError {
    fn from(err: crate::services::ConfigError) -> Self {
        InstallError {
            message: err.to_string(),
            error_type: "config_error".to_string(),
        }
    }
}

/// Response from install_server command
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallServerResponse {
    /// Installation result
    pub install_result: InstallResult,
    /// Sync result (if sync was performed)
    pub sync_result: Option<SyncResult>,
}

/// Response from uninstall_server command
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UninstallServerResponse {
    /// Whether uninstall succeeded
    pub success: bool,
    /// Name of the removed server
    pub server_name: String,
    /// Sync result (if sync was performed)
    pub sync_result: Option<SyncResult>,
    /// Error message (if any)
    pub error: Option<String>,
}

/// Request to validate installation requirements
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateInstallRequest {
    pub source: InstallSource,
}

/// Response from validate_install command
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateInstallResponse {
    pub valid: bool,
    pub error: Option<String>,
    pub missing_runtime: Option<String>,
    pub suggestion: Option<String>,
}

/// Install a new MCP server
///
/// This command:
/// 1. Validates that required runtimes are available
/// 2. For GitHub sources, clones the repository and runs setup
/// 3. Creates the server configuration
/// 4. Saves to central config
/// 5. Syncs to enabled clients
#[tauri::command]
pub async fn install_mcp_server(
    state: State<'_, Mutex<AppState>>,
    request: InstallServerRequest,
    sync_after_install: Option<bool>,
) -> Result<InstallServerResponse, InstallError> {
    // Run doctor to get current environment status
    let doctor_report = run_doctor();

    // Install the server
    let server = do_install(&request, &doctor_report)?;

    // Save to config
    let server_clone = {
        let state = state.lock().unwrap();
        state.config_manager.add_server(server.clone())?
    };

    let install_result = InstallResult {
        success: true,
        server: Some(server_clone),
        error: None,
        warnings: vec![],
    };

    // Optionally sync to clients
    let sync_result = if sync_after_install.unwrap_or(true) {
        let state = state.lock().unwrap();
        let config = state.config_manager.load()?;
        Some(sync_to_all_clients(&config))
    } else {
        None
    };

    Ok(InstallServerResponse {
        install_result,
        sync_result,
    })
}

/// Uninstall an MCP server
///
/// This command:
/// 1. Removes the server from the central config
/// 2. Cleans up any local resources (e.g., cloned repositories)
/// 3. Syncs the removal to all clients
#[tauri::command]
pub async fn uninstall_mcp_server(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
    cleanup_resources: Option<bool>,
    sync_after_uninstall: Option<bool>,
) -> Result<UninstallServerResponse, InstallError> {
    let uuid = uuid::Uuid::parse_str(&server_id).map_err(|e| InstallError {
        message: format!("Invalid server ID: {}", e),
        error_type: "invalid_id".to_string(),
    })?;

    // Get the server first (for cleanup and response)
    let server = {
        let state = state.lock().unwrap();
        state.config_manager.get_server(&uuid)?
    };

    let server_name = server.name.clone();

    // Cleanup resources if requested
    if cleanup_resources.unwrap_or(true) {
        if let Err(e) = do_cleanup(&server) {
            // Log but don't fail - the server will still be removed from config
            eprintln!("Warning: Failed to cleanup server resources: {}", e);
        }
    }

    // Remove from config
    {
        let state = state.lock().unwrap();
        state.config_manager.remove_server(&uuid)?;
    }

    // Optionally sync to clients
    let sync_result = if sync_after_uninstall.unwrap_or(true) {
        let state = state.lock().unwrap();
        let config = state.config_manager.load()?;
        Some(sync_to_all_clients(&config))
    } else {
        None
    };

    Ok(UninstallServerResponse {
        success: true,
        server_name,
        sync_result,
        error: None,
    })
}

/// Validate that a server can be installed
///
/// Checks that required runtimes are available without actually installing
#[tauri::command]
pub async fn validate_install(
    request: ValidateInstallRequest,
) -> Result<ValidateInstallResponse, InstallError> {
    let doctor_report = run_doctor();

    match validate_runtime(&request.source, &doctor_report) {
        Ok(()) => Ok(ValidateInstallResponse {
            valid: true,
            error: None,
            missing_runtime: None,
            suggestion: None,
        }),
        Err(e) => {
            let (missing, suggestion) = match &e {
                crate::services::InstallationError::MissingRuntime(runtime, sugg) => {
                    (Some(runtime.clone()), Some(sugg.clone()))
                }
                _ => (None, None),
            };

            Ok(ValidateInstallResponse {
                valid: false,
                error: Some(e.to_string()),
                missing_runtime: missing,
                suggestion,
            })
        }
    }
}

/// Check if required runtimes are available for a package registry
#[tauri::command]
pub async fn check_runtime_for_registry(
    registry: String,
) -> Result<ValidateInstallResponse, InstallError> {
    let doctor_report = run_doctor();

    let source = match registry.to_lowercase().as_str() {
        "npm" => InstallSource::Npm {
            package: "test".to_string(),
            version: None,
            args: vec![],
        },
        "pypi" => InstallSource::Uvx {
            package: "test".to_string(),
            args: vec![],
        },
        "docker" => InstallSource::Docker {
            image: "test".to_string(),
            docker_args: vec![],
        },
        "github" => InstallSource::Github {
            repo: "test/test".to_string(),
            branch: None,
            run_command: None,
        },
        _ => {
            return Ok(ValidateInstallResponse {
                valid: true,
                error: None,
                missing_runtime: None,
                suggestion: Some("Unknown registry, assuming no runtime needed".to_string()),
            });
        }
    };

    match validate_runtime(&source, &doctor_report) {
        Ok(()) => Ok(ValidateInstallResponse {
            valid: true,
            error: None,
            missing_runtime: None,
            suggestion: None,
        }),
        Err(e) => {
            let (missing, suggestion) = match &e {
                crate::services::InstallationError::MissingRuntime(runtime, sugg) => {
                    (Some(runtime.clone()), Some(sugg.clone()))
                }
                _ => (None, None),
            };

            Ok(ValidateInstallResponse {
                valid: false,
                error: Some(e.to_string()),
                missing_runtime: missing,
                suggestion,
            })
        }
    }
}
