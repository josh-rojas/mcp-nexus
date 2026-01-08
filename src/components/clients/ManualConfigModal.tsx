import { useState, useEffect } from "react";
import type { DetectedClient } from "../../types";
import { notifyManualConfigCopied } from "../../lib/notifications";

interface ManualConfigModalProps {
  client: DetectedClient | null;
  configJson: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function ManualConfigModal({
  client,
  configJson,
  isLoading,
  error,
  onClose,
}: ManualConfigModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!client) return null;

  const handleCopy = async () => {
    if (configJson) {
      try {
        await navigator.clipboard.writeText(configJson);
        setCopied(true);
        notifyManualConfigCopied(client.name);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = configJson;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        notifyManualConfigCopied(client.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg
                className="h-6 w-6 text-amber-600 dark:text-amber-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {client.name} Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manual configuration required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-6 w-6"
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

        {/* Instructions */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">
                {client.name} requires manual configuration
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-300">
                <li>Copy the configuration JSON below</li>
                <li>Open {client.name} settings</li>
                <li>Navigate to the MCP configuration section</li>
                <li>Paste the configuration and save</li>
              </ol>
              {client.docsUrl && (
                <a
                  href={client.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View documentation
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
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
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                {configJson || "No configuration available"}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            disabled={isLoading || !configJson}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4"
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
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
