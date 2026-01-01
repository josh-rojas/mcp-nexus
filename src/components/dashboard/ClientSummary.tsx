import { useDetectedClients, useClientStatuses } from "../../hooks/useClients";
import { SummaryCard } from "./SummaryCard";

export function ClientSummary() {
  const { data: clients, isLoading: isLoadingClients } = useDetectedClients();
  const { data: statuses, isLoading: isLoadingStatuses } = useClientStatuses();

  const isLoading = isLoadingClients || isLoadingStatuses;

  const detectedCount = clients?.filter((c) => c.detected).length ?? 0;
  const enabledCount =
    statuses?.filter((s) => s.enabled).length ?? detectedCount;
  const manualCount =
    clients?.filter((c) => c.detected && c.syncMode === "manualOnly").length ??
    0;

  const getSubtitle = () => {
    if (detectedCount === 0) return "No clients detected";
    const parts: string[] = [];
    if (enabledCount > 0) parts.push(`${enabledCount} syncing`);
    if (manualCount > 0) parts.push(`${manualCount} manual`);
    return parts.join(", ") || `${detectedCount} detected`;
  };

  return (
    <SummaryCard
      title="AI Clients"
      value={detectedCount}
      subtitle={getSubtitle()}
      isLoading={isLoading}
      iconBgColor="bg-green-100 dark:bg-green-900/30"
      icon={
        <svg
          className="h-6 w-6 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      }
      link="/clients"
      linkLabel="View clients"
    />
  );
}
