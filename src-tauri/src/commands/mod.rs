mod clients;
mod config;
mod doctor;
mod health;
mod installation;
mod keychain;
mod marketplace;
mod sync;
mod system;
mod updates;

pub use clients::{detect_clients, get_all_client_statuses, get_client_config, get_client_status};
pub use config::{
    add_server, get_config, get_server, get_servers, initialize_config, remove_server, save_config,
    toggle_server_client, update_server, AppState,
};
pub use doctor::run_doctor;
pub use health::{check_all_health, check_health, get_server_status};
pub use installation::{
    check_runtime_for_registry, install_mcp_server, uninstall_mcp_server, validate_install,
};
pub use keychain::{
    check_credential_exists, delete_credential, get_credential_value, list_credentials,
    save_credential, validate_credential_references,
};
pub use marketplace::MarketplaceState;
pub use marketplace::{
    check_marketplace_cache, clear_marketplace_cache, get_server_details, search_servers,
};
pub use sync::{
    get_manual_config, import_client_servers, set_client_sync_enabled, sync_all_clients,
    sync_client,
};
pub use system::get_system_accent_color;
pub use updates::{
    check_for_updates, check_package_version, check_server_update, get_update_count,
};
