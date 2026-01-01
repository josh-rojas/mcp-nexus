// src/components/dashboard/UpdateSummary.tsx
import { SummaryCard } from "./SummaryCard";
import { useUpdateCount } from "../../hooks/useUpdates";

/**
 * Dashboard card showing update availability status
 */
export function UpdateSummary() {
  const { data: updateCount, isLoading, isError } = useUpdateCount();

  const hasUpdates = (updateCount ?? 0) > 0;

  // Icon for update available
  const updateIcon = (
    <svg
      className="w-8 h-8 text-amber-600 dark:text-amber-400"
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
  );

  // Icon for up to date
  const checkIcon = (
    <svg
      className="w-8 h-8 text-green-600 dark:text-green-400"
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
  );

  // Show loading state
  if (isLoading) {
    return (
      <SummaryCard
        title="Updates"
        value="..."
        subtitle="Checking for updates"
        icon={updateIcon}
        iconBgColor="bg-gray-100 dark:bg-gray-700"
        isLoading={true}
      />
    );
  }

  // Show error state
  if (isError) {
    return (
      <SummaryCard
        title="Updates"
        value="?"
        subtitle="Unable to check"
        icon={updateIcon}
        iconBgColor="bg-gray-100 dark:bg-gray-700"
        link="/settings"
        linkLabel="Go to Settings"
      />
    );
  }

  // Show update count
  if (hasUpdates) {
    return (
      <SummaryCard
        title="Updates Available"
        value={updateCount ?? 0}
        subtitle={`${updateCount} server${updateCount !== 1 ? "s" : ""} can be updated`}
        icon={updateIcon}
        iconBgColor="bg-amber-100 dark:bg-amber-900/30"
        link="/settings"
        linkLabel="View Updates"
      />
    );
  }

  // All up to date
  return (
    <SummaryCard
      title="Updates"
      value="0"
      subtitle="All servers up to date"
      icon={checkIcon}
      iconBgColor="bg-green-100 dark:bg-green-900/30"
      link="/settings"
      linkLabel="Check for Updates"
    />
  );
}
