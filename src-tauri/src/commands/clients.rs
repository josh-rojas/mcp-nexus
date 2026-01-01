use crate::models::{ClientConfigInfo, ClientId, ClientSyncStatus, DetectedClient};
use crate::services::{
    detect_all_clients, detect_client, get_client_config_info, get_client_config_path,
};
use std::sync::Mutex;
use tauri::State;

use super::config::{AppState, CommandError};

/// Detect all AI clients installed on the system
#[tauri::command]
pub fn detect_clients() -> Result<Vec<DetectedClient>, CommandError> {
    let clients = detect_all_clients();
    Ok(clients)
}

/// Get detailed status for a specific client
#[tauri::command]
pub fn get_client_status(
    state: State<'_, Mutex<AppState>>,
    client_id: String,
) -> Result<ClientSyncStatus, CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    // Get client settings from config
    let state = state.lock().unwrap();
    let config = state.config_manager.load().map_err(|e| CommandError {
        message: e.to_string(),
    })?;

    // Get settings for this client, or create default
    let settings = config.clients.get(id.as_str());

    // Detect client to get current state
    let detected = detect_client(id);

    // Check if config has been modified externally (by comparing checksums)
    let externally_modified = if let (Some(settings), true) = (settings, detected.config_exists) {
        if let Some(last_checksum) = &settings.last_sync_checksum {
            // Read current file and compute checksum
            if let Ok(path) = get_client_config_path(id) {
                if let Ok(content) = std::fs::read(&path) {
                    let current_checksum = compute_checksum(&content);
                    &current_checksum != last_checksum
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false // No previous sync, so can't be modified
        }
    } else {
        false
    };

    Ok(ClientSyncStatus {
        client_id: id,
        enabled: settings.map(|s| s.enabled).unwrap_or(true),
        last_sync: settings.and_then(|s| s.last_sync.clone()),
        last_sync_checksum: settings.and_then(|s| s.last_sync_checksum.clone()),
        externally_modified,
        sync_error: detected.error,
    })
}

/// Get all clients with their sync status
#[tauri::command]
pub fn get_all_client_statuses(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<ClientSyncStatus>, CommandError> {
    let state_guard = state.lock().unwrap();
    let config = state_guard
        .config_manager
        .load()
        .map_err(|e| CommandError {
            message: e.to_string(),
        })?;
    drop(state_guard); // Release lock before detecting clients

    let detected_clients = detect_all_clients();

    let statuses: Vec<ClientSyncStatus> = detected_clients
        .iter()
        .map(|detected| {
            let settings = config.clients.get(detected.id.as_str());

            // Check if externally modified
            let externally_modified =
                if let (Some(settings), true) = (settings, detected.config_exists) {
                    if let Some(last_checksum) = &settings.last_sync_checksum {
                        if let Some(path) = &detected.config_path {
                            if let Ok(content) = std::fs::read(path) {
                                let current_checksum = compute_checksum(&content);
                                &current_checksum != last_checksum
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                } else {
                    false
                };

            ClientSyncStatus {
                client_id: detected.id,
                enabled: settings.map(|s| s.enabled).unwrap_or(true),
                last_sync: settings.and_then(|s| s.last_sync.clone()),
                last_sync_checksum: settings.and_then(|s| s.last_sync_checksum.clone()),
                externally_modified,
                sync_error: detected.error.clone(),
            }
        })
        .collect();

    Ok(statuses)
}

/// Get the config info for a client (for import purposes)
#[tauri::command]
pub fn get_client_config(client_id: String) -> Result<Option<ClientConfigInfo>, CommandError> {
    // Parse client ID
    let id: ClientId =
        serde_json::from_value(serde_json::json!(client_id)).map_err(|e| CommandError {
            message: format!("Invalid client ID '{}': {}", client_id, e),
        })?;

    get_client_config_info(id).map_err(|e| CommandError {
        message: e.to_string(),
    })
}

/// Compute a checksum for file content (for change detection)
fn compute_checksum(content: &[u8]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_checksum() {
        let content1 = b"hello world";
        let content2 = b"hello world";
        let content3 = b"different content";

        let checksum1 = compute_checksum(content1);
        let checksum2 = compute_checksum(content2);
        let checksum3 = compute_checksum(content3);

        assert_eq!(checksum1, checksum2);
        assert_ne!(checksum1, checksum3);
    }
}
