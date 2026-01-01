mod commands;
mod models;
mod services;

use commands::{
    add_server, check_all_health, check_credential_exists, check_for_updates, check_health,
    check_marketplace_cache, check_package_version, check_runtime_for_registry,
    check_server_update, clear_marketplace_cache, delete_credential, detect_clients,
    get_all_client_statuses, get_client_config, get_client_status, get_config,
    get_credential_value, get_manual_config, get_server, get_server_details, get_server_status,
    get_servers, get_update_count, import_client_servers, initialize_config, install_mcp_server,
    list_credentials, remove_server, run_doctor, save_config, save_credential, search_servers,
    set_client_sync_enabled, sync_all_clients, sync_client, toggle_server_client,
    uninstall_mcp_server, update_server, validate_credential_references, validate_install,
    AppState, MarketplaceState,
};
use services::{ConfigManager, MarketplaceClient};
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize the config manager
    let config_manager = ConfigManager::new().expect("Failed to initialize config manager");

    // Initialize the marketplace client
    let marketplace_state = Arc::new(RwLock::new(MarketplaceState {
        client: MarketplaceClient::new(),
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(AppState { config_manager }))
        .manage(marketplace_state)
        .invoke_handler(tauri::generate_handler![
            // Config commands
            initialize_config,
            get_config,
            save_config,
            get_servers,
            get_server,
            add_server,
            update_server,
            remove_server,
            toggle_server_client,
            // Doctor commands
            run_doctor,
            // Client commands
            detect_clients,
            get_client_status,
            get_all_client_statuses,
            get_client_config,
            // Sync commands
            sync_client,
            sync_all_clients,
            import_client_servers,
            get_manual_config,
            set_client_sync_enabled,
            // Marketplace commands
            search_servers,
            get_server_details,
            clear_marketplace_cache,
            check_marketplace_cache,
            // Installation commands
            install_mcp_server,
            uninstall_mcp_server,
            validate_install,
            check_runtime_for_registry,
            // Update commands
            check_for_updates,
            check_server_update,
            check_package_version,
            get_update_count,
            // Keychain commands
            save_credential,
            get_credential_value,
            delete_credential,
            list_credentials,
            check_credential_exists,
            validate_credential_references,
            // Health check commands
            check_health,
            check_all_health,
            get_server_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
