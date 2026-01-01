use crate::models::{McpHubConfig, McpServer};
use crate::services::{ConfigError, ConfigManager};
use std::sync::Mutex;
use tauri::State;

/// Application state holding the config manager
pub struct AppState {
    pub config_manager: ConfigManager,
}

/// Error type for command responses
#[derive(Debug, serde::Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<ConfigError> for CommandError {
    fn from(err: ConfigError) -> Self {
        CommandError {
            message: err.to_string(),
        }
    }
}

/// Result of initialization check
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitResult {
    /// Whether this is the first run (no config existed)
    pub first_run: bool,
    /// Path to the config directory
    pub config_dir: String,
    /// Path to the config file
    pub config_path: String,
}

/// Initialize the config system and return status
#[tauri::command]
pub fn initialize_config(state: State<'_, Mutex<AppState>>) -> Result<InitResult, CommandError> {
    let state = state.lock().unwrap();
    let first_run = state.config_manager.initialize()?;

    Ok(InitResult {
        first_run,
        config_dir: state
            .config_manager
            .config_dir()
            .to_string_lossy()
            .to_string(),
        config_path: state
            .config_manager
            .config_path()
            .to_string_lossy()
            .to_string(),
    })
}

/// Get the full configuration
#[tauri::command]
pub fn get_config(state: State<'_, Mutex<AppState>>) -> Result<McpHubConfig, CommandError> {
    let state = state.lock().unwrap();
    state.config_manager.load().map_err(Into::into)
}

/// Save the full configuration
#[tauri::command]
pub fn save_config(
    state: State<'_, Mutex<AppState>>,
    config: McpHubConfig,
) -> Result<(), CommandError> {
    let state = state.lock().unwrap();
    state.config_manager.save(&config).map_err(Into::into)
}

/// Get all servers
#[tauri::command]
pub fn get_servers(state: State<'_, Mutex<AppState>>) -> Result<Vec<McpServer>, CommandError> {
    let state = state.lock().unwrap();
    state.config_manager.get_servers().map_err(Into::into)
}

/// Get a single server by ID
#[tauri::command]
pub fn get_server(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
) -> Result<McpServer, CommandError> {
    let state = state.lock().unwrap();
    let uuid = uuid::Uuid::parse_str(&server_id).map_err(|e| CommandError {
        message: format!("Invalid server ID: {}", e),
    })?;
    state.config_manager.get_server(&uuid).map_err(Into::into)
}

/// Add a new server
#[tauri::command]
pub fn add_server(
    state: State<'_, Mutex<AppState>>,
    server: McpServer,
) -> Result<McpServer, CommandError> {
    let state = state.lock().unwrap();
    state.config_manager.add_server(server).map_err(Into::into)
}

/// Update an existing server
#[tauri::command]
pub fn update_server(
    state: State<'_, Mutex<AppState>>,
    server: McpServer,
) -> Result<McpServer, CommandError> {
    let state = state.lock().unwrap();
    state
        .config_manager
        .update_server(server)
        .map_err(Into::into)
}

/// Remove a server by ID
#[tauri::command]
pub fn remove_server(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
) -> Result<McpServer, CommandError> {
    let state = state.lock().unwrap();
    let uuid = uuid::Uuid::parse_str(&server_id).map_err(|e| CommandError {
        message: format!("Invalid server ID: {}", e),
    })?;
    state
        .config_manager
        .remove_server(&uuid)
        .map_err(Into::into)
}

/// Toggle a server's enabled status for a specific client
#[tauri::command]
pub fn toggle_server_client(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
    client_id: String,
    enabled: bool,
) -> Result<(), CommandError> {
    let state = state.lock().unwrap();
    let uuid = uuid::Uuid::parse_str(&server_id).map_err(|e| CommandError {
        message: format!("Invalid server ID: {}", e),
    })?;
    state
        .config_manager
        .toggle_server_client(&uuid, &client_id, enabled)
        .map_err(Into::into)
}
