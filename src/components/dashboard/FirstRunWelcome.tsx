import { useState } from "react";
import { Link } from "react-router-dom";
import { useDetectedClients, useImportClientServers } from "../../hooks/useClients";
import type { ClientId } from "../../types";

export function FirstRunWelcome() {
  const { data: clients } = useDetectedClients();
  const importServers = useImportClientServers();
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<ClientId>>(
    new Set()
  );

  const clientsWithServers =
    clients?.filter((c) => c.detected && c.serverCount > 0) ?? [];

  const handleToggleClient = (clientId: ClientId) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedClients.size === 0) return;

    setImporting(true);
    try {
      for (const clientId of selectedClients) {
        await importServers.mutateAsync({ clientId, overwriteExisting: false });
      }
      setImportComplete(true);
    } finally {
      setImporting(false);
    }
  };

  if (importComplete) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Import Complete</h2>
            <p className="text-blue-100 mb-4">
              Your existing MCP servers have been imported. You can now manage
              them all from one place.
            </p>
            <div className="flex gap-3">
              <Link
                to="/servers"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                View Servers
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-lg">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">Welcome to MCP Manager</h2>
          <p className="text-blue-100 mb-4">
            Manage all your MCP servers from one central location. Install
            servers once and sync them to all your AI clients.
          </p>

          {clientsWithServers.length > 0 ? (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-3">
                We found existing MCP servers in these clients:
              </h3>
              <div className="space-y-2">
                {clientsWithServers.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleToggleClient(client.id)}
                      className="w-4 h-4 rounded border-white/30 bg-white/20 text-blue-400 focus:ring-blue-400"
                    />
                    <span>
                      {client.name}{" "}
                      <span className="text-blue-200">
                        ({client.serverCount} server
                        {client.serverCount !== 1 ? "s" : ""})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleImport}
                disabled={importing || selectedClients.size === 0}
                className="mt-4 inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Import Selected
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/marketplace"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse Marketplace
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Check Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
