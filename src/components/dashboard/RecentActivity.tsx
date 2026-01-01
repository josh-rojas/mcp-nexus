import { useServerList } from "../../hooks/useServers";
import { useClientStatuses } from "../../hooks/useClients";
import { formatDistanceToNow } from "../../lib/utils";

interface ActivityItem {
  type: "install" | "sync" | "update";
  title: string;
  description: string;
  timestamp: string;
}

export function RecentActivity() {
  const { data: servers } = useServerList();
  const { data: clientStatuses } = useClientStatuses();

  // Build activity items from servers and sync statuses
  const activities: ActivityItem[] = [];

  // Add server installations
  servers?.forEach((server) => {
    activities.push({
      type: "install",
      title: "Server installed",
      description: server.name,
      timestamp: server.installedAt,
    });

    if (server.updatedAt !== server.installedAt) {
      activities.push({
        type: "update",
        title: "Server updated",
        description: server.name,
        timestamp: server.updatedAt,
      });
    }
  });

  // Add recent syncs
  clientStatuses?.forEach((status) => {
    if (status.lastSync) {
      activities.push({
        type: "sync",
        title: "Config synced",
        description: status.clientId,
        timestamp: status.lastSync,
      });
    }
  });

  // Sort by timestamp (most recent first) and take top 5
  const sortedActivities = activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  if (sortedActivities.length === 0) {
    return null;
  }

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "install":
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg
              className="h-4 w-4 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
        );
      case "sync":
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
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
          </div>
        );
      case "update":
        return (
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <svg
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
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
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {sortedActivities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            {getActivityIcon(activity.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {formatDistanceToNow(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
