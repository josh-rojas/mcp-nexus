// src/lib/notifications.ts
// Semantic notification helpers wrapping the generic notification store.
// These helpers standardize titles/messages for critical operations and
// intentionally avoid including secrets or other sensitive values.

import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "../stores/notificationStore";

/**
 * Convert unknown error values into a human-friendly message while
 * providing a safe fallback. Callers MUST NOT pass secrets in error
 * objects or strings.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

// ============================================================================
// Server install / uninstall notifications
// ============================================================================

export function notifyServerInstallSuccess(serverName: string) {
  return showSuccess(
    "Server installed",
    `"${serverName}" has been installed and added to your MCP Nexus configuration.`
  );
}

export function notifyServerInstallError(serverName: string, error: unknown) {
  const message = getErrorMessage(
    error,
    `Failed to install "${serverName}". Check your runtimes and logs for details.`
  );

  return showError("Server install failed", message);
}

export function notifyServerUninstallSuccess(serverName: string) {
  return showSuccess(
    "Server uninstalled",
    `"${serverName}" has been removed from your MCP Nexus configuration.`
  );
}

export function notifyServerUninstallError(serverName: string, error: unknown) {
  const message = getErrorMessage(
    error,
    `Failed to uninstall "${serverName}".`
  );

  return showError("Server uninstall failed", message);
}

// ============================================================================
// Sync notifications (per-client and global)
// ============================================================================

export function notifySyncAllSuccess() {
  return showSuccess(
    "Sync complete",
    "Configuration has been synced to all enabled clients."
  );
}

export function notifySyncAllError(error: unknown) {
  const message = getErrorMessage(
    error,
    "Failed to sync configuration to all clients. Review client statuses and logs at ~/.mcp-nexus/logs/auto-sync.log for details."
  );

  return showError("Sync failed", message);
}

export function notifyClientSyncSuccess(clientName: string) {
  return showSuccess(
    "Client synced",
    `Configuration has been synced to ${clientName}.`
  );
}

export function notifyClientSyncError(clientName: string, error: unknown) {
  const message = getErrorMessage(
    error,
    `Failed to sync configuration to ${clientName}.`
  );

  return showError("Client sync failed", message);
}

export function notifyManualConfigCopied(clientName: string) {
  return showInfo(
    "Config copied",
    `Manual configuration for ${clientName} has been copied to your clipboard.`
  );
}

// ============================================================================
// Credential operation notifications
// ============================================================================

export function notifyCredentialSaveSuccess(name: string, isUpdate: boolean) {
  return showSuccess(
    isUpdate ? "Credential updated" : "Credential saved",
    `"${name}" has been securely stored in your system keychain.`
  );
}

export function notifyCredentialSaveError(error: unknown) {
  const message = getErrorMessage(
    error,
    "Failed to save credential. Verify keychain access and try again."
  );

  return showError("Credential save failed", message);
}

export function notifyCredentialDeleteSuccess(name: string) {
  return showSuccess(
    "Credential deleted",
    `"${name}" has been removed from your keychain.`
  );
}

export function notifyCredentialDeleteError(error: unknown) {
  const message = getErrorMessage(
    error,
    "Failed to delete credential from your keychain."
  );

  return showError("Credential delete failed", message);
}

// ============================================================================
// Generic install / uninstall helpers for non-server resources
// ============================================================================

export function notifyInstallWarning(message: string) {
  return showWarning("Install warning", message);
}

export function notifyGenericError(operation: string, error: unknown) {
  const message = getErrorMessage(
    error,
    `An unexpected error occurred while ${operation}.`
  );

  return showError("Unexpected error", message);
}
