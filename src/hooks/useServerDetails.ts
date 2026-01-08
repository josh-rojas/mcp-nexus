import { useQuery } from "@tanstack/react-query";
import { getServerDetails } from "../lib/tauri";
import type { MarketplaceServer } from "../types";

/**
 * Hook to fetch detailed information for a specific marketplace server.
 * 
 * @param name - The name of the server to fetch details for
 * @param initialData - Optional initial data to show while fetching (e.g. from list view)
 */
export function useServerDetails(name: string | null, initialData?: MarketplaceServer | null) {
  return useQuery({
    queryKey: ["marketplace", "details", name],
    queryFn: async () => {
      if (!name) return null;
      return getServerDetails(name);
    },
    // Only run query if we have a name
    enabled: !!name,
    // Use initial data if provided (e.g. from the list view)
    initialData: initialData || undefined,
    // Cache for 5 minutes (matches backend cache)
    staleTime: 5 * 60 * 1000, 
  });
}
