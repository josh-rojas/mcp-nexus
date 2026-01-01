// src-tauri/src/services/keychain.rs
//! Secure credential storage using the OS keychain (macOS Keychain, Windows Credential Manager, etc.)
//!
//! This module provides functions to store, retrieve, and manage secrets securely.
//! Credentials are stored under the service name "com.mcp-manager.credentials".

use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use thiserror::Error;

/// Service identifier for keychain entries
const KEYCHAIN_SERVICE: &str = "com.mcp-manager.credentials";

/// File name for storing credential keys (not values)
const CREDENTIAL_KEYS_FILE: &str = "credential_keys.json";

#[derive(Error, Debug)]
pub enum KeychainError {
    #[error("Keychain access error: {0}")]
    KeyringError(String),

    #[error("Credential not found: {0}")]
    NotFound(String),

    #[error("Failed to read credential keys file: {0}")]
    KeysFileReadError(String),

    #[error("Failed to write credential keys file: {0}")]
    KeysFileWriteError(String),

    #[error("Invalid credential name: {0}")]
    InvalidName(String),

    #[error("Home directory not found")]
    HomeNotFound,
}

impl From<keyring::Error> for KeychainError {
    fn from(err: keyring::Error) -> Self {
        match err {
            keyring::Error::NoEntry => KeychainError::NotFound("No entry found".to_string()),
            _ => KeychainError::KeyringError(err.to_string()),
        }
    }
}

/// Result of storing a credential
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreCredentialResult {
    pub name: String,
    pub success: bool,
    pub is_update: bool,
}

/// Get the path to the credential keys file
fn get_keys_file_path() -> Result<PathBuf, KeychainError> {
    let home = dirs::home_dir().ok_or(KeychainError::HomeNotFound)?;
    Ok(home.join(".mcp-manager").join(CREDENTIAL_KEYS_FILE))
}

/// Load the set of credential keys from disk
fn load_credential_keys() -> Result<HashSet<String>, KeychainError> {
    let path = get_keys_file_path()?;

    if !path.exists() {
        return Ok(HashSet::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| KeychainError::KeysFileReadError(e.to_string()))?;

    if content.trim().is_empty() {
        return Ok(HashSet::new());
    }

    serde_json::from_str(&content)
        .map_err(|e| KeychainError::KeysFileReadError(e.to_string()))
}

/// Save the set of credential keys to disk
fn save_credential_keys(keys: &HashSet<String>) -> Result<(), KeychainError> {
    let path = get_keys_file_path()?;

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;

            // Set directory permissions to 0700 on Unix
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let permissions = fs::Permissions::from_mode(0o700);
                fs::set_permissions(parent, permissions)
                    .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;
            }
        }
    }

    let content = serde_json::to_string_pretty(keys)
        .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;

    // Write to temp file first (atomic write pattern)
    let temp_path = path.with_extension("json.tmp");
    fs::write(&temp_path, &content)
        .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;

    // Set file permissions to 0600 on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let permissions = fs::Permissions::from_mode(0o600);
        fs::set_permissions(&temp_path, permissions)
            .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;
    }

    // Atomic rename
    fs::rename(&temp_path, &path)
        .map_err(|e| KeychainError::KeysFileWriteError(e.to_string()))?;

    Ok(())
}

/// Validate credential name (alphanumeric, hyphens, underscores only)
fn validate_credential_name(name: &str) -> Result<(), KeychainError> {
    if name.is_empty() {
        return Err(KeychainError::InvalidName(
            "Credential name cannot be empty".to_string(),
        ));
    }

    if name.len() > 256 {
        return Err(KeychainError::InvalidName(
            "Credential name too long (max 256 characters)".to_string(),
        ));
    }

    // Allow alphanumeric, hyphens, underscores, and periods
    let valid = name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.');

    if !valid {
        return Err(KeychainError::InvalidName(
            "Credential name can only contain letters, numbers, hyphens, underscores, and periods"
                .to_string(),
        ));
    }

    Ok(())
}

/// Create a keyring entry for the given credential name
fn create_entry(name: &str) -> Result<Entry, KeychainError> {
    Entry::new(KEYCHAIN_SERVICE, name)
        .map_err(|e| KeychainError::KeyringError(e.to_string()))
}

/// Store a credential securely in the OS keychain
///
/// # Arguments
/// * `name` - The name/key for this credential (e.g., "github-token")
/// * `value` - The secret value to store
///
/// # Returns
/// Result indicating success and whether this was an update
pub fn store_credential(name: &str, value: &str) -> Result<StoreCredentialResult, KeychainError> {
    validate_credential_name(name)?;

    // Check if credential already exists
    let mut keys = load_credential_keys()?;
    let is_update = keys.contains(name);

    // Store in keychain
    let entry = create_entry(name)?;
    entry.set_password(value)?;

    // Add to keys list if new
    if !is_update {
        keys.insert(name.to_string());
        save_credential_keys(&keys)?;
    }

    Ok(StoreCredentialResult {
        name: name.to_string(),
        success: true,
        is_update,
    })
}

/// Retrieve a credential from the OS keychain
///
/// # Arguments
/// * `name` - The name/key of the credential to retrieve
///
/// # Returns
/// The secret value, or an error if not found
pub fn get_credential(name: &str) -> Result<String, KeychainError> {
    validate_credential_name(name)?;

    let entry = create_entry(name)?;
    entry.get_password().map_err(KeychainError::from)
}

/// Delete a credential from the OS keychain
///
/// # Arguments
/// * `name` - The name/key of the credential to delete
///
/// # Returns
/// Ok(true) if deleted, Ok(false) if not found
pub fn delete_credential(name: &str) -> Result<bool, KeychainError> {
    validate_credential_name(name)?;

    // Remove from keychain
    let entry = create_entry(name)?;
    match entry.delete_credential() {
        Ok(()) => {}
        Err(keyring::Error::NoEntry) => return Ok(false),
        Err(e) => return Err(KeychainError::KeyringError(e.to_string())),
    }

    // Remove from keys list
    let mut keys = load_credential_keys()?;
    let removed = keys.remove(name);

    if removed {
        save_credential_keys(&keys)?;
    }

    Ok(true)
}

/// List all stored credential names (not values)
///
/// # Returns
/// A list of credential names
pub fn list_credentials() -> Result<Vec<String>, KeychainError> {
    let keys = load_credential_keys()?;
    let mut names: Vec<String> = keys.into_iter().collect();
    names.sort();
    Ok(names)
}

/// Check if a credential exists
///
/// # Arguments
/// * `name` - The name/key of the credential to check
///
/// # Returns
/// true if the credential exists
pub fn credential_exists(name: &str) -> Result<bool, KeychainError> {
    validate_credential_name(name)?;

    let keys = load_credential_keys()?;
    Ok(keys.contains(name))
}

/// Resolve a keychain reference in an environment variable value
///
/// Keychain references have the format: `keychain:credential-name`
/// or `${keychain:credential-name}` for compatibility with shell-like syntax
///
/// # Arguments
/// * `value` - The environment variable value to check
///
/// # Returns
/// The resolved value (credential from keychain) or the original value if not a reference
pub fn resolve_keychain_reference(value: &str) -> Result<String, KeychainError> {
    // Check for ${keychain:name} format
    if value.starts_with("${keychain:") && value.ends_with('}') {
        let name = &value[11..value.len() - 1];
        return get_credential(name);
    }

    // Check for keychain:name format
    if value.starts_with("keychain:") {
        let name = &value[9..];
        return get_credential(name);
    }

    // Not a keychain reference, return original value
    Ok(value.to_string())
}

/// Check if a value is a keychain reference
pub fn is_keychain_reference(value: &str) -> bool {
    (value.starts_with("${keychain:") && value.ends_with('}')) || value.starts_with("keychain:")
}

/// Extract the credential name from a keychain reference
pub fn extract_credential_name(value: &str) -> Option<String> {
    if value.starts_with("${keychain:") && value.ends_with('}') {
        Some(value[11..value.len() - 1].to_string())
    } else if value.starts_with("keychain:") {
        Some(value[9..].to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_credential_name_valid() {
        assert!(validate_credential_name("github-token").is_ok());
        assert!(validate_credential_name("my_api_key").is_ok());
        assert!(validate_credential_name("service.key").is_ok());
        assert!(validate_credential_name("key123").is_ok());
        assert!(validate_credential_name("API_KEY_V2").is_ok());
    }

    #[test]
    fn test_validate_credential_name_invalid() {
        assert!(validate_credential_name("").is_err());
        assert!(validate_credential_name("key with spaces").is_err());
        assert!(validate_credential_name("key/with/slashes").is_err());
        assert!(validate_credential_name("key@special").is_err());
    }

    #[test]
    fn test_validate_credential_name_too_long() {
        let long_name = "a".repeat(257);
        assert!(validate_credential_name(&long_name).is_err());
    }

    #[test]
    fn test_is_keychain_reference() {
        assert!(is_keychain_reference("keychain:github-token"));
        assert!(is_keychain_reference("${keychain:github-token}"));
        assert!(!is_keychain_reference("not-a-reference"));
        assert!(!is_keychain_reference("${env:PATH}"));
        assert!(!is_keychain_reference("keychain"));
    }

    #[test]
    fn test_extract_credential_name() {
        assert_eq!(
            extract_credential_name("keychain:github-token"),
            Some("github-token".to_string())
        );
        assert_eq!(
            extract_credential_name("${keychain:api-key}"),
            Some("api-key".to_string())
        );
        assert_eq!(extract_credential_name("not-a-reference"), None);
    }

    #[test]
    fn test_resolve_non_reference() {
        let result = resolve_keychain_reference("regular-value").unwrap();
        assert_eq!(result, "regular-value");
    }

    // Integration tests that require actual keychain access are marked with #[ignore]
    // Run with: cargo test -- --ignored

    #[test]
    #[ignore = "Requires keychain access"]
    fn test_store_and_get_credential() {
        let name = "test-credential-integration";
        let value = "super-secret-value";

        // Store
        let result = store_credential(name, value).unwrap();
        assert!(result.success);

        // Get
        let retrieved = get_credential(name).unwrap();
        assert_eq!(retrieved, value);

        // Clean up
        delete_credential(name).unwrap();
    }

    #[test]
    #[ignore = "Requires keychain access"]
    fn test_delete_credential() {
        let name = "test-delete-credential";

        // Store first
        store_credential(name, "to-be-deleted").unwrap();

        // Delete
        let deleted = delete_credential(name).unwrap();
        assert!(deleted);

        // Verify gone
        let deleted_again = delete_credential(name).unwrap();
        assert!(!deleted_again);
    }

    #[test]
    #[ignore = "Requires keychain access"]
    fn test_list_credentials() {
        let name1 = "test-list-cred-1";
        let name2 = "test-list-cred-2";

        // Store two credentials
        store_credential(name1, "value1").unwrap();
        store_credential(name2, "value2").unwrap();

        // List should contain both
        let list = list_credentials().unwrap();
        assert!(list.contains(&name1.to_string()));
        assert!(list.contains(&name2.to_string()));

        // Clean up
        delete_credential(name1).unwrap();
        delete_credential(name2).unwrap();
    }

    #[test]
    #[ignore = "Requires keychain access"]
    fn test_resolve_keychain_reference_integration() {
        let name = "test-resolve-ref";
        let value = "resolved-secret";

        // Store credential
        store_credential(name, value).unwrap();

        // Resolve reference
        let resolved = resolve_keychain_reference("keychain:test-resolve-ref").unwrap();
        assert_eq!(resolved, value);

        let resolved2 = resolve_keychain_reference("${keychain:test-resolve-ref}").unwrap();
        assert_eq!(resolved2, value);

        // Clean up
        delete_credential(name).unwrap();
    }
}
