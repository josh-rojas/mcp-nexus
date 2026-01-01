// src/components/servers/HealthStatusBadge.tsx
import { useServerHealth, getHealthStatusColor, getHealthStatusBgColor, getHealthStatusLabel } from "../../hooks/useHealth";
import type { HealthStatus } from "../../types";

interface HealthStatusBadgeProps {
  serverId: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

/** Badge showing server health status with auto-refresh */
export function HealthStatusBadge({
  serverId,
  showLabel = true,
  size = "sm",
}: HealthStatusBadgeProps) {
  const { data: health, isLoading, error } = useServerHealth(serverId);

  const status: HealthStatus = health?.status ?? "unknown";
  const colorClass = getHealthStatusColor(status);
  const bgClass = getHealthStatusBgColor(status);
  const label = getHealthStatusLabel(status);

  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  if (isLoading) {
    return (
      <span className={`inline-flex items-center rounded-full ${sizeClasses} bg-gray-100 dark:bg-gray-800 text-gray-500`}>
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse mr-1.5" />
        {showLabel && "Checking..."}
      </span>
    );
  }

  if (error) {
    return (
      <span className={`inline-flex items-center rounded-full ${sizeClasses} bg-red-100 dark:bg-red-900/30 text-red-500`}>
        <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
        {showLabel && "Error"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses} ${bgClass} ${colorClass}`}
      title={health?.message ?? undefined}
    >
      <span className={`w-2 h-2 rounded-full ${colorClass.replace("text-", "bg-")} mr-1.5`} />
      {showLabel && label}
    </span>
  );
}

interface HealthStatusDotProps {
  status: HealthStatus;
  size?: "sm" | "md" | "lg";
}

/** Simple dot indicator for health status */
export function HealthStatusDot({ status, size = "sm" }: HealthStatusDotProps) {
  const colorClass = getHealthStatusColor(status);
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses[size]} ${colorClass.replace("text-", "bg-")}`}
      title={getHealthStatusLabel(status)}
    />
  );
}

