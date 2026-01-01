// src-tauri/src/commands/keychain.rs
//! Tauri commands for credential management via the OS keychain

use crate::services::{
    credential_exists, delete_credential as service_delete, get_credential as service_get,
    list_credentials as service_list, store_credential as service_store, StoreCredentialResult,
};
use serde::{Deserialize, Serialize};

/// Response for keychain operations
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeychainResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> KeychainResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Information about a credential (for listing)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialListItem {
    pub name: String,
    /// Indicates if this credential is referenced by any servers
    pub in_use: bool,
}

/// Store a credential in the OS keychain
///
/// This securely stores a secret value that can be referenced in server
/// environment variables using the `keychain:name` or `${keychain:name}` syntax.
#[tauri::command]
pub fn save_credential(name: String, value: String) -> KeychainResponse<StoreCredentialResult> {
    match service_store(&name, &value) {
        Ok(result) => KeychainResponse::success(result),
        Err(e) => KeychainResponse::error(e.to_string()),
    }
}

/// Retrieve a credential from the OS keychain
///
/// Note: This command returns the actual secret value. It should only be called
/// when the value is actually needed (e.g., for sync), never for display purposes.
#[tauri::command]
pub fn get_credential_value(name: String) -> KeychainResponse<String> {
    match service_get(&name) {
        Ok(value) => KeychainResponse::success(value),
        Err(e) => KeychainResponse::error(e.to_string()),
    }
}

/// Delete a credential from the OS keychain
#[tauri::command]
pub fn delete_credential(name: String) -> KeychainResponse<bool> {
    match service_delete(&name) {
        Ok(deleted) => KeychainResponse::success(deleted),
        Err(e) => KeychainResponse::error(e.to_string()),
    }
}

/// List all stored credential names
///
/// Returns only the names, never the values, for security.
#[tauri::command]
pub fn list_credentials() -> KeychainResponse<Vec<String>> {
    match service_list() {
        Ok(names) => KeychainResponse::success(names),
        Err(e) => KeychainResponse::error(e.to_string()),
    }
}

/// Check if a credential exists
#[tauri::command]
pub fn check_credential_exists(name: String) -> KeychainResponse<bool> {
    match credential_exists(&name) {
        Ok(exists) => KeychainResponse::success(exists),
        Err(e) => KeychainResponse::error(e.to_string()),
    }
}

/// Validate that all keychain references in a server's env vars are resolvable
///
/// Returns a list of missing credential names if any are not found.
#[tauri::command]
pub fn validate_credential_references(env_vars: std::collections::HashMap<String, String>) -> KeychainResponse<Vec<String>> {
    use crate::services::{extract_credential_name, is_keychain_reference};

    let mut missing: Vec<String> = Vec::new();

    for value in env_vars.values() {
        if is_keychain_reference(value) {
            if let Some(name) = extract_credential_name(value) {
                match credential_exists(&name) {
                    Ok(true) => {}
                    Ok(false) => missing.push(name),
                    Err(_) => missing.push(name),
                }
            }
        }
    }

    KeychainResponse::success(missing)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keychain_response_success() {
        let response: KeychainResponse<String> = KeychainResponse::success("test".to_string());
        assert!(response.success);
        assert_eq!(response.data.unwrap(), "test");
        assert!(response.error.is_none());
    }

    #[test]
    fn test_keychain_response_error() {
        let response: KeychainResponse<String> = KeychainResponse::error("failed".to_string());
        assert!(!response.success);
        assert!(response.data.is_none());
        assert_eq!(response.error.unwrap(), "failed");
    }
}
