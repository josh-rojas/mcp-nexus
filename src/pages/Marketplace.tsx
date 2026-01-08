import { useState, useCallback } from "react";
import { Header } from "../components/layout/Header";
import {
  SearchBar,
  SortDropdown,
  FilterChips,
  MarketplaceCard,
  MarketplaceCardSkeleton,
  ServerDetailModal,
} from "../components/marketplace";
import { useMarketplace } from "../hooks/useMarketplace";
import {
  notifyServerInstallSuccess,
  notifyServerInstallError,
} from "../lib/notifications";
import type { SortOption, MarketplaceServer, ClientId } from "../types";

export function Marketplace() {
  // Search and filter state
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [communityOnly, setCommunityOnly] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(false);

  // Selected server for detail view
  const [selectedServer, setSelectedServer] =
    useState<MarketplaceServer | null>(null);

  // Installation state
  const [isInstalling, setIsInstalling] = useState(false);

  // Fetch marketplace data
  const {
    servers,
    totalCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    isRefreshing,
  } = useMarketplace({
    query,
    sort,
    officialOnly,
    communityOnly,
    remoteAvailable,
  });

  const handleServerSelect = useCallback((server: MarketplaceServer) => {
    setSelectedServer(server);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedServer(null);
  }, []);

  const handleInstall = useCallback(
    async (
      server: MarketplaceServer,
      selectedClients: ClientId[],
      sseUrl?: string
    ) => {
      setIsInstalling(true);
      try {
        // TODO: Implement actual installation in Phase 4.1
        // For now, log the installation request
        console.log("Installing server:", {
          server: server.name,
          clients: selectedClients,
          sseUrl,
        });

        // Simulate installation delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        notifyServerInstallSuccess(server.name);

        // Close modal after successful installation
        setSelectedServer(null);
      } catch (error) {
        console.error("Installation failed:", error);
        notifyServerInstallError(server.name, error);
      } finally {
        setIsInstalling(false);
      }
    },
    []
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, loadMore]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Marketplace"
        subtitle={
          isLoading
            ? "Loading..."
            : `${totalCount.toLocaleString()} servers available`
        }
        actions={
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        }
      />
      <main
        className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto"
        role="main"
      >
        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          {/* Search and sort row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search MCP servers..."
              />
            </div>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {/* Filter chips */}
          <FilterChips
            officialOnly={officialOnly}
            communityOnly={communityOnly}
            remoteAvailable={remoteAvailable}
            onOfficialChange={setOfficialOnly}
            onCommunityChange={setCommunityOnly}
            onRemoteChange={setRemoteAvailable}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0"
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
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Failed to load servers
                </h3>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                <button
                  onClick={refresh}
                  className="mt-3 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state - initial load */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <MarketplaceCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Server grid */}
        {!isLoading && !error && servers.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server, index) => (
                <MarketplaceCard
                  key={`${server.name}-${index}`}
                  server={server}
                  onSelect={handleServerSelect}
                />
              ))}
              {/* Loading more skeletons */}
              {isLoadingMore &&
                Array.from({ length: 3 }).map((_, i) => (
                  <MarketplaceCardSkeleton key={`loading-${i}`} />
                ))}
            </div>

            {/* Load more button */}
            {hasMore && !isLoadingMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}

            {/* End of results indicator */}
            {!hasMore && servers.length > 0 && (
              <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                Showing all {servers.length} results
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!isLoading && !error && servers.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No servers found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {query
                ? `No servers match "${query}". Try a different search term or adjust your filters.`
                : "No servers available with the current filters. Try adjusting your filters."}
            </p>
            {(query || officialOnly || communityOnly || remoteAvailable) && (
              <button
                onClick={() => {
                  setQuery("");
                  setOfficialOnly(false);
                  setCommunityOnly(false);
                  setRemoteAvailable(false);
                }}
                className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Server detail modal */}
      <ServerDetailModal
        server={selectedServer}
        onClose={handleCloseModal}
        onInstall={handleInstall}
        isInstalling={isInstalling}
      />
    </div>
  );
}
