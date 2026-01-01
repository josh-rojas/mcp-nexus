// src-tauri/src/commands/health.rs
//! Tauri commands for server health checks

use crate::commands::config::AppState;
use crate::services::{check_server_health, HealthCheckResult, HealthStatus};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// Error type for health check commands
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthError {
    pub message: String,
}

impl From<String> for HealthError {
    fn from(s: String) -> Self {
        HealthError { message: s }
    }
}

impl From<&str> for HealthError {
    fn from(s: &str) -> Self {
        HealthError {
            message: s.to_string(),
        }
    }
}

/// Check health of a single server
#[tauri::command]
pub async fn check_health(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
) -> Result<HealthCheckResult, HealthError> {
    // Get the server from config
    let server = {
        let state = state.lock().unwrap();
        let server_uuid = uuid::Uuid::parse_str(&server_id)
            .map_err(|e| HealthError::from(format!("Invalid server ID: {}", e)))?;
        state
            .config_manager
            .get_server(&server_uuid)
            .map_err(|e| HealthError::from(format!("Server not found: {}", e)))?
    };

    // Perform health check with 10 second timeout
    let result = check_server_health(&server, 10).await;
    Ok(result)
}

/// Check health of all servers
#[tauri::command]
pub async fn check_all_health(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<HealthCheckResult>, HealthError> {
    // Get all servers from config
    let servers = {
        let state = state.lock().unwrap();
        state
            .config_manager
            .get_servers()
            .map_err(|e| HealthError::from(format!("Failed to get servers: {}", e)))?
    };

    // Check health of each server concurrently
    let mut results = Vec::new();
    for server in servers {
        let result = check_server_health(&server, 10).await;
        results.push(result);
    }

    Ok(results)
}

/// Get quick status of a server (without full health check)
#[tauri::command]
pub fn get_server_status(
    state: State<'_, Mutex<AppState>>,
    server_id: String,
) -> Result<HealthStatus, HealthError> {
    let state = state.lock().unwrap();
    let server_uuid = uuid::Uuid::parse_str(&server_id)
        .map_err(|e| HealthError::from(format!("Invalid server ID: {}", e)))?;

    // Check if server exists
    let server = state
        .config_manager
        .get_server(&server_uuid)
        .map_err(|e| HealthError::from(format!("Server not found: {}", e)))?;

    // For now, return Unknown since we don't track running processes persistently
    // In a full implementation, we'd check the process tracker
    if server.enabled {
        Ok(HealthStatus::Unknown)
    } else {
        Ok(HealthStatus::Stopped)
    }
}
