import type { MarketplaceServer } from "../../types";

interface MarketplaceCardProps {
  server: MarketplaceServer;
  onSelect: (server: MarketplaceServer) => void;
}

/** Format large numbers with K/M suffixes */
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/** Get package registry badge color */
function getRegistryColor(registry: string | undefined): string {
  switch (registry?.toLowerCase()) {
    case "npm":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    case "pypi":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    case "docker":
      return "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300";
    default:
      return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  }
}

export function MarketplaceCard({ server, onSelect }: MarketplaceCardProps) {
  const hasRemote = server.remotes && server.remotes.length > 0;

  return (
    <button
      onClick={() => onSelect(server)}
      className="text-left w-full bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-transparent hover:border-blue-500 dark:hover:border-blue-400"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {server.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Remote badge */}
          {hasRemote && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Remote
            </span>
          )}
          {/* Registry badge */}
          {server.package_registry && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${getRegistryColor(server.package_registry)}`}>
              {server.package_registry}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {server.short_description || server.ai_description || "No description available"}
      </p>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {/* GitHub stars */}
        {server.github_stars !== undefined && server.github_stars > 0 && (
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{formatNumber(server.github_stars)}</span>
          </div>
        )}

        {/* Download count */}
        {server.package_download_count !== undefined && server.package_download_count > 0 && (
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{formatNumber(server.package_download_count)}</span>
          </div>
        )}

        {/* Package name */}
        {server.package_name && (
          <div className="flex items-center gap-1 truncate">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="truncate">{server.package_name}</span>
          </div>
        )}
      </div>
    </button>
  );
}

/** Loading skeleton for MarketplaceCard */
export function MarketplaceCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4">
        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
