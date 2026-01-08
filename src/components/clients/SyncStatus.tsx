import {
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  X,
} from "lucide-react";
import type { SyncResult } from "../../types";

interface SyncStatusProps {
  result: SyncResult | null;
  isLoading: boolean;
  onDismiss: () => void;
}

export function SyncStatus({ result, isLoading, onDismiss }: SyncStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Loader2
            className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-label="Loading"
            role="status"
          />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">
              Syncing to clients...
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
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
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          ) : allSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
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
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
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
              <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Info className="h-4 w-4 flex-shrink-0" />
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
