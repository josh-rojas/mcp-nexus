use crate::models::ClientId;
use crate::services::get_client_config_path;
use crate::services::sync_engine::{
    import_from_client, sync_to_all_clients, sync_to_client, update_client_sync_status,
    ClientSyncResult, ImportResult, SyncResult,
};
use chrono::Utc;
use dirs;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::sync::Mutex;
use tauri::State;

use super::config::{AppState, CommandError};

/// Append failed sync results to an auto-sync log file under ~/.mcp-nexus/logs/.
fn append_sync_log(result: &SyncResult) {
    if result.failed == 0 {
        return;
    }

    let home = match dirs::home_dir() {
        Some(path) => path,
        None => return,
    };

    let log_dir = home.join(".mcp-nexus").join("logs");
    if let Err(e) = create_dir_all(&log_dir) {
        eprintln!("Failed to create log directory {:?}: {}", log_dir, e);
        return;
    }

    let log_path = log_dir.join("auto-sync.log");
    let file_result = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path);

    let mut file = match file_result {
        Ok(f) => f,
        Err(e) => {
            eprintln!("Failed to open auto-sync log {:?}: {}", log_path, e);
            return;
        }
    };

    let timestamp = Utc::now().to_rfc3339();
    for client_result in &result.results {
        if client_result.success {
            continue;
        }

        let error = client_result
            .error
            .as_deref()
            .unwrap_or("Unknown sync error");

        if let Err(e) = writeln!(
            file,
            "{} client_id={} error={}",
            timestamp,
            client_result.client_id.as_str(),
            error
        ) {
            eprintln!("Failed to write to auto-sync log {:?}: {}", log_path, e);
            break;
        }
    }
}

/// Sync configuration to a single client
#[tauri::command]
pub fn sync_client(
    state: State<'_, Mutex<AppState>>,
    client_id: String,
) -> Result<ClientSyncResult, CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    let state = state.lock().unwrap();
    let config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    let result = sync_to_client(id, &config);

    // Update client settings if sync was successful
    if result.success && result.manual_config.is_none() {
        if let Ok(path) = get_client_config_path(id) {
            let mut updated_config = config.clone();
            update_client_sync_status(&mut updated_config, id, &path.to_string_lossy());
            state
                .config_manager
                .save(&updated_config)
                .map_err(|e| CommandError {
                    message: e.to_string(),
                })?;
        }
    }

    Ok(result)
}

/// Sync configuration to all enabled clients
#[tauri::command]
pub fn sync_all_clients(state: State<'_, Mutex<AppState>>) -> Result<SyncResult, CommandError> {
    let state = state.lock().unwrap();
    let config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    let result = sync_to_all_clients(&config);

    // Log any failed syncs for observability (used by auto-sync and manual sync).
    append_sync_log(&result);

    // Update client settings for successful syncs
    let mut updated_config = config.clone();
    for client_result in &result.results {
        if client_result.success && client_result.manual_config.is_none() {
            if let Ok(path) = get_client_config_path(client_result.client_id) {
                update_client_sync_status(
                    &mut updated_config,
                    client_result.client_id,
                    &path.to_string_lossy(),
                );
            }
        }
    }

    state
        .config_manager
        .save(&updated_config)
        .map_err(|e| CommandError {
            message: e.to_string(),
        })?;

    Ok(result)
}

/// Import servers from a client's configuration
#[tauri::command]
pub fn import_client_servers(
    state: State<'_, Mutex<AppState>>,
    client_id: String,
    overwrite_existing: bool,
) -> Result<ImportResult, CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    let state = state.lock().unwrap();
    let mut config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    let result =
        import_from_client(id, &mut config, overwrite_existing).map_err(|e| CommandError {
            message: e.to_string(),
        })?;

    // Save updated config
    state
        .config_manager
        .save(&config)
        .map_err(|e| CommandError {
            message: e.to_string(),
        })?;

    Ok(result)
}

/// Get the generated config JSON for a manual-configuration client (like Warp)
#[tauri::command]
pub fn get_manual_config(
    state: State<'_, Mutex<AppState>>,
    client_id: String,
) -> Result<String, CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    let state = state.lock().unwrap();
    let config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    // Generate the config
    let result = sync_to_client(id, &config);

    result.manual_config.ok_or_else(|| CommandError {
        message: format!(
            "Client '{}' does not require manual configuration",
            client_id
        ),
    })
}

/// Enable or disable syncing for a specific client
#[tauri::command]
pub fn set_client_sync_enabled(
    state: State<'_, Mutex<AppState>>,
    client_id: String,
    enabled: bool,
) -> Result<(), CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    let state = state.lock().unwrap();
    let mut config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    // Get or create client settings
    let settings = config
        .clients
        .entry(id.as_str().to_string())
        .or_insert_with(|| crate::models::ClientSettings {
            enabled: true,
            config_path: String::new(),
            last_sync: None,
            last_sync_checksum: None,
        });

    settings.enabled = enabled;

    state
        .config_manager
        .save(&config)
        .map_err(|e| CommandError {
            message: e.to_string(),
        })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    // Note: Integration tests would require mocking Tauri state
    // Unit tests for the underlying sync_engine module are in sync_engine.rs
}
