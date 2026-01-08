import { useState, useMemo } from "react";
import type { McpServer, ClientId } from "../../types";
import { ServerCard } from "./ServerCard";
import { SearchBar } from "../marketplace/SearchBar";

interface ServerListProps {
  servers: McpServer[];
  onToggleClient: (serverId: string, clientId: ClientId, enabled: boolean) => void;
  onRemove: (serverId: string) => void;
  onViewDetails: (server: McpServer) => void;
  isLoading?: boolean;
}

type FilterType = "all" | "stdio" | "sse" | "npm" | "uvx" | "docker" | "local" | "remote" | "github";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Servers" },
  { value: "stdio", label: "stdio" },
  { value: "sse", label: "SSE" },
  { value: "npm", label: "npm" },
  { value: "uvx", label: "Python/uvx" },
  { value: "docker", label: "Docker" },
  { value: "local", label: "Local" },
  { value: "remote", label: "Remote" },
  { value: "github", label: "GitHub" },
];

export function ServerList({
  servers,
  onToggleClient,
  onRemove,
  onViewDetails,
  isLoading,
}: ServerListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = server.name.toLowerCase().includes(searchLower);
        const matchesDescription = server.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Type filter
      if (filter !== "all") {
        if (filter === "stdio" || filter === "sse") {
          if (server.transport.type !== filter) {
            return false;
          }
        } else {
          if (server.source.type !== filter) {
            return false;
          }
        }
      }

      return true;
    });
  }, [servers, search, filter]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search installed servers..."
            debounceMs={200}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-system-accent focus:border-transparent transition-colors"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {search || filter !== "all" ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredServers.length} of {servers.length} servers
          {(search || filter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="ml-2 text-system-accent dark:text-system-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      {/* Server grid */}
      {filteredServers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onToggleClient={onToggleClient}
              onRemove={onRemove}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
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
            No matching servers
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {search
              ? `No servers match "${search}".`
              : "No servers match the selected filter."}
          </p>
        </div>
      )}
    </div>
  );
}

/** Loading skeleton for ServerCard */
function ServerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="mt-2 h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="mt-1 h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-5 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}
