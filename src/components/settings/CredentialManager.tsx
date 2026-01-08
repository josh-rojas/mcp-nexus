import { useState, useMemo } from "react";
import { useCredentials } from "../../hooks/useCredentials";
import { useServerList } from "../../hooks/useServers";
import {
  notifyCredentialDeleteError,
  notifyCredentialDeleteSuccess,
  notifyCredentialSaveError,
  notifyCredentialSaveSuccess,
} from "../../lib/notifications";
import type { McpServer } from "../../types";

/** Extract keychain reference names from a value */
function extractKeychainName(value: string): string | null {
  if (value.startsWith("${keychain:") && value.endsWith("}")) {
    return value.substring(11, value.length - 1);
  }
  if (value.startsWith("keychain:")) {
    return value.substring(9);
  }
  return null;
}

/** Get all credentials used by a server */
function getCredentialsUsedByServer(server: McpServer): string[] {
  const refs: string[] = [];
  if (server.transport.type === "stdio" && server.transport.env) {
    for (const value of Object.values(server.transport.env)) {
      const name = extractKeychainName(value);
      if (name) refs.push(name);
    }
  }
  if (server.transport.type === "sse" && server.transport.headers) {
    for (const value of Object.values(server.transport.headers)) {
      const name = extractKeychainName(value);
      if (name) refs.push(name);
    }
  }
  return refs;
}

export function CredentialManager() {
  const {
    credentials,
    isLoading,
    error,
    saveCredential,
    deleteCredential,
    isSaving,
  } = useCredentials();

  const { data: servers = [] } = useServerList();

  // Map each credential to the servers that use it
  const credentialUsage = useMemo(() => {
    const usage: Record<string, string[]> = {};
    for (const name of credentials) {
      usage[name] = [];
    }
    for (const server of servers) {
      const refs = getCredentialsUsedByServer(server);
      for (const ref of refs) {
        if (usage[ref]) {
          usage[ref].push(server.name);
        }
      }
    }
    return usage;
  }, [credentials, servers]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingName(null);
    setKeyName("");
    setSecretValue("");
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (name: string) => {
    setEditingName(name);
    setKeyName(name);
    setSecretValue(""); // Don't show existing value for security
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setKeyName("");
    setSecretValue("");
    setActionError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!keyName.trim()) {
      setActionError("Credential name is required");
      return;
    }

    if (!secretValue) {
      setActionError("Secret value is required");
      return;
    }

    try {
      await saveCredential({ name: keyName, value: secretValue });
      notifyCredentialSaveSuccess(keyName, !!editingName);
      handleClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save credential");
      notifyCredentialSaveError(err);
    }
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Are you sure you want to delete credential "${name}"?`)) {
      try {
        await deleteCredential(name);
        notifyCredentialDeleteSuccess(name);
      } catch (err) {
        notifyCredentialDeleteError(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading credentials...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        Error loading credentials: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Secure Credentials
        </h3>
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Credential
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Securely store API keys and tokens in your system keychain.
        Reference them in server environment variables using{" "}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
          keychain:credential-name
        </code>
        .
      </p>

      {credentials.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No credentials stored yet.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Used By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {credentials.map((name: string) => {
                const usedBy = credentialUsage[name] || [];
                return (
                  <tr key={name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {usedBy.length === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          Not in use
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {usedBy.map((serverName) => (
                            <span
                              key={serverName}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {serverName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEdit(name)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(name)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title={usedBy.length > 0 ? `Warning: Used by ${usedBy.join(", ")}` : undefined}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingName ? "Update Credential" : "Add Credential"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={!!editingName}
                  placeholder="e.g. github-token"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!editingName && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Use alphanumeric characters, hyphens, and underscores only.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Value
                </label>
                <input
                  type="password"
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="Enter secret value..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? "Saving..." : "Save Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
