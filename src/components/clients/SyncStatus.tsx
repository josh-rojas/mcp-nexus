import type { SyncResult } from "../../types";

interface SyncStatusProps {
  result: SyncResult | null;
  isLoading: boolean;
  onDismiss: () => void;
}

export function SyncStatus({ result, isLoading, onDismiss }: SyncStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-system-accent/5 dark:bg-system-accent/15 border border-system-accent/20 dark:border-system-accent/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin h-5 w-5 text-system-accent dark:text-system-accent"
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
          <div>
            <p className="font-medium text-system-accent dark:text-system-accent">
              Syncing to clients...
            </p>
            <p className="text-sm text-system-accent dark:text-system-accent">
              Please wait while configurations are updated
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const hasErrors = result.failed > 0;
  const hasManual = result.manualRequired > 0;
  const allSuccess = result.successful === result.totalClients && !hasErrors;

  return (
    <div
      className={`rounded-lg p-4 ${
        hasErrors
          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          : allSuccess
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {hasErrors ? (
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : allSuccess ? (
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          <div>
            <p
              className={`font-medium ${
                hasErrors
                  ? "text-red-700 dark:text-red-300"
                  : allSuccess
                    ? "text-green-700 dark:text-green-300"
                    : "text-amber-700 dark:text-amber-300"
              }`}
            >
              Sync Complete
            </p>
            <p
              className={`text-sm ${
                hasErrors
                  ? "text-red-600 dark:text-red-400"
                  : allSuccess
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {result.successful} of {result.totalClients} clients synced
              {hasErrors && ` (${result.failed} failed)`}
              {hasManual && ` (${result.manualRequired} need manual config)`}
            </p>

            {/* Detailed results */}
            <div className="mt-2 space-y-1">
              {result.results.map((r) => (
                <div
                  key={r.clientId}
                  className={`text-xs flex items-center gap-1 ${
                    r.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {r.success ? (
                    <svg
                      className="h-3 w-3"
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
                  ) : (
                    <svg
                      className="h-3 w-3"
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
                  )}
                  <span>
                    {r.clientId}
                    {r.manualConfig && " (manual)"}
                    {r.error && `: ${r.error}`}
                    {r.success &&
                      !r.manualConfig &&
                      ` (${r.serversSynced} servers)`}
                  </span>
                </div>
              ))}
            </div>

            {/* Restart notice */}
            {result.successful > 0 && (
              <div className="mt-3 p-2 bg-system-accent/10 dark:bg-system-accent/20 rounded text-xs text-system-accent dark:text-system-accent flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0"
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
                <span>
                  Restart your AI clients to apply the updated configurations.
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            className="h-5 w-5"
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
    </div>
  );
}
