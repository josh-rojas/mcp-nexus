// src-tauri/src/services/health.rs
//! Server health check functionality for both stdio and SSE servers

use crate::models::{McpServer, Transport};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

/// Health status for a server
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    /// Server is responding correctly
    Healthy,
    /// Server failed health check
    Unhealthy,
    /// Server health is unknown (not checked yet or check failed)
    Unknown,
    /// Server is currently starting/running
    Running,
    /// Server is not running
    Stopped,
}

/// Result of a health check
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub server_id: String,
    pub status: HealthStatus,
    pub message: Option<String>,
    pub checked_at: String,
    pub response_time_ms: Option<u64>,
}

/// Perform a health check on an SSE server by making an HTTP request
pub async fn check_sse_health(url: &str, timeout_secs: u64) -> HealthCheckResult {
    let now = chrono::Utc::now();
    let start = std::time::Instant::now();

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => {
            return HealthCheckResult {
                server_id: String::new(),
                status: HealthStatus::Unknown,
                message: Some(format!("Failed to create HTTP client: {}", e)),
                checked_at: now.to_rfc3339(),
                response_time_ms: None,
            };
        }
    };

    match client.get(url).send().await {
        Ok(response) => {
            let elapsed = start.elapsed().as_millis() as u64;
            let status = response.status();

            if status.is_success() || status.as_u16() == 200 || status.as_u16() == 204 {
                HealthCheckResult {
                    server_id: String::new(),
                    status: HealthStatus::Healthy,
                    message: Some(format!("HTTP {}", status.as_u16())),
                    checked_at: now.to_rfc3339(),
                    response_time_ms: Some(elapsed),
                }
            } else {
                HealthCheckResult {
                    server_id: String::new(),
                    status: HealthStatus::Unhealthy,
                    message: Some(format!("HTTP {} - {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown"))),
                    checked_at: now.to_rfc3339(),
                    response_time_ms: Some(elapsed),
                }
            }
        }
        Err(e) => {
            let elapsed = start.elapsed().as_millis() as u64;
            HealthCheckResult {
                server_id: String::new(),
                status: HealthStatus::Unhealthy,
                message: Some(format!("Connection failed: {}", e)),
                checked_at: now.to_rfc3339(),
                response_time_ms: Some(elapsed),
            }
        }
    }
}

/// Perform a health check on a stdio server by attempting to spawn and check for response
pub async fn check_stdio_health(
    command: &str,
    args: &[String],
    env: &HashMap<String, String>,
    _timeout_secs: u64,
) -> HealthCheckResult {
    let now = chrono::Utc::now();
    let start = std::time::Instant::now();

    // Try to spawn the process
    use tokio::process::Command;

    let mut cmd = Command::new(command);
    cmd.args(args);
    cmd.envs(env.iter());
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    match cmd.spawn() {
        Ok(mut child) => {
            // Give the process a moment to initialize
            tokio::time::sleep(Duration::from_millis(500)).await;

            // Check if the process is still running
            match child.try_wait() {
                Ok(Some(status)) => {
                    // Process exited
                    let elapsed = start.elapsed().as_millis() as u64;
                    if status.success() {
                        HealthCheckResult {
                            server_id: String::new(),
                            status: HealthStatus::Healthy,
                            message: Some("Process started and exited successfully".to_string()),
                            checked_at: now.to_rfc3339(),
                            response_time_ms: Some(elapsed),
                        }
                    } else {
                        HealthCheckResult {
                            server_id: String::new(),
                            status: HealthStatus::Unhealthy,
                            message: Some(format!("Process exited with status: {}", status)),
                            checked_at: now.to_rfc3339(),
                            response_time_ms: Some(elapsed),
                        }
                    }
                }
                Ok(None) => {
                    // Process is still running - that's good for a server
                    // Kill it since this is just a health check
                    let _ = child.kill().await;
                    let elapsed = start.elapsed().as_millis() as u64;
                    HealthCheckResult {
                        server_id: String::new(),
                        status: HealthStatus::Healthy,
                        message: Some("Server process started successfully".to_string()),
                        checked_at: now.to_rfc3339(),
                        response_time_ms: Some(elapsed),
                    }
                }
                Err(e) => {
                    let elapsed = start.elapsed().as_millis() as u64;
                    HealthCheckResult {
                        server_id: String::new(),
                        status: HealthStatus::Unknown,
                        message: Some(format!("Failed to check process status: {}", e)),
                        checked_at: now.to_rfc3339(),
                        response_time_ms: Some(elapsed),
                    }
                }
            }
        }
        Err(e) => {
            let elapsed = start.elapsed().as_millis() as u64;
            HealthCheckResult {
                server_id: String::new(),
                status: HealthStatus::Unhealthy,
                message: Some(format!("Failed to spawn process: {}", e)),
                checked_at: now.to_rfc3339(),
                response_time_ms: Some(elapsed),
            }
        }
    }
}

/// Check health of a server based on its transport type
pub async fn check_server_health(server: &McpServer, timeout_secs: u64) -> HealthCheckResult {
    let mut result = match &server.transport {
        Transport::Sse { url, .. } => check_sse_health(url, timeout_secs).await,
        Transport::Stdio { command, args, env } => {
            check_stdio_health(command, args, env, timeout_secs).await
        }
    };

    result.server_id = server.id.to_string();
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status_serialization() {
        let status = HealthStatus::Healthy;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"healthy\"");

        let parsed: HealthStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, HealthStatus::Healthy);
    }
}
