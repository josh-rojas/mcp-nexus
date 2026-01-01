mod client_detector;
mod config_manager;
mod doctor;
pub mod health;
pub mod installation;
pub mod keychain;
mod marketplace_client;
pub mod sync_engine;
mod updates;

pub use client_detector::{
    detect_all_clients, detect_client, get_client_config_info, get_client_config_path,
};
pub use config_manager::{ConfigError, ConfigManager};
pub use doctor::run_doctor;
pub use health::{check_server_health, HealthCheckResult, HealthStatus};
pub use installation::{
    cleanup_server, install_server, validate_runtime, InstallResult, InstallServerRequest,
    InstallSource, InstallationError,
};
pub use keychain::{
    credential_exists, delete_credential, extract_credential_name, get_credential,
    is_keychain_reference, list_credentials, store_credential, StoreCredentialResult,
};
pub use marketplace_client::MarketplaceClient;
pub use updates::{
    check_for_updates_detailed, check_npm_version, check_pypi_version, is_newer_version,
    ServerUpdate, UpdateCheckResult,
};
