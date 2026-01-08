import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { searchServers, clearMarketplaceCache } from "../lib/tauri";
import type { SortOption, SearchServersParams, MarketplaceServer, SearchResult } from "../types";

export interface UseMarketplaceParams {
  query: string;
  sort: SortOption;
  officialOnly: boolean;
  communityOnly: boolean;
  remoteAvailable: boolean;
  pageSize?: number;
}

/** Hook for fetching marketplace servers with infinite scroll */
export function useMarketplace({
  query,
  sort,
  officialOnly,
  communityOnly,
  remoteAvailable,
  pageSize = 20,
}: UseMarketplaceParams) {
  const queryClient = useQueryClient();

  const infiniteQuery = useInfiniteQuery<SearchResult, Error>({
    queryKey: ["marketplace", "search", { query, sort, officialOnly, communityOnly, remoteAvailable }],
    queryFn: async ({ pageParam }) => {
      const params: SearchServersParams = {
        query: query || undefined,
        sort,
        officialOnly: officialOnly || undefined,
        communityOnly: communityOnly || undefined,
        remoteAvailable: remoteAvailable || undefined,
        pageSize,
        page: pageParam as number,
      };
      return searchServers(params);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - match the Rust cache TTL
  });

  // Flatten all pages into a single array of servers
  const servers: MarketplaceServer[] = infiniteQuery.data?.pages.flatMap((page) => page.servers) ?? [];

  // Get total count from the first page
  const totalCount = infiniteQuery.data?.pages[0]?.totalCount ?? 0;

  // Refresh function that also clears the backend cache
  const refresh = async () => {
    await clearMarketplaceCache();
    queryClient.invalidateQueries({ queryKey: ["marketplace", "search"] });
  };

  return {
    servers,
    totalCount,
    isLoading: infiniteQuery.isLoading,
    isLoadingMore: infiniteQuery.isFetchingNextPage,
    error: infiniteQuery.error,
    hasMore: infiniteQuery.hasNextPage ?? false,
    loadMore: infiniteQuery.fetchNextPage,
    refresh,
    isRefreshing: infiniteQuery.isRefetching,
  };
}
