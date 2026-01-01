// src/components/servers/UpdateBadge.tsx
import type { ServerUpdate } from "../../types";

interface UpdateBadgeProps {
  /** Update info for the server (from useServerUpdate hook) */
  update?: ServerUpdate | null;
  /** Whether the update check is loading */
  isLoading?: boolean;
  /** Whether to show version numbers */
  showVersions?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Badge component to show update availability for a server
 *
 * Shows:
 * - Loading state while checking
 * - "Update available" if new version exists
 * - Version numbers if showVersions is true
 * - Nothing if no update or can't check
 */
export function UpdateBadge({
  update,
  isLoading,
  showVersions = false,
  size = "sm",
}: UpdateBadgeProps) {
  // Loading state
  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded ${
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        } bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`}
      >
        <svg
          className="w-3 h-3 animate-spin"
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
        <span>Checking...</span>
      </span>
    );
  }

  // No update info available
  if (!update) {
    return null;
  }

  // Update available
  if (update.updateAvailable) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded ${
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        } bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium`}
        title={
          showVersions && update.latestVersion
            ? `Update available: ${update.installedVersion ?? "unknown"} → ${update.latestVersion}`
            : "Update available"
        }
      >
        <svg
          className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
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
        {showVersions && update.latestVersion ? (
          <span>
            {update.installedVersion ?? "?"} → {update.latestVersion}
          </span>
        ) : (
          <span>Update</span>
        )}
      </span>
    );
  }

  // Up to date (optionally show)
  if (update.latestVersion && showVersions) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded ${
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        } bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`}
        title="Up to date"
      >
        <svg
          className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
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
        <span>v{update.installedVersion ?? update.latestVersion}</span>
      </span>
    );
  }

  // No update, no version to show
  return null;
}

/**
 * Count badge for updates available
 *
 * Shows a simple count indicator for use in navigation or headers.
 */
interface UpdateCountBadgeProps {
  /** Number of updates available */
  count: number;
  /** Whether the check is loading */
  isLoading?: boolean;
}

export function UpdateCountBadge({ count, isLoading }: UpdateCountBadgeProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
        <svg
          className="w-3 h-3 animate-spin"
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
      </span>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium bg-amber-500 text-white rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}
