import { useServerList } from "../../hooks/useServers";
import { SummaryCard } from "./SummaryCard";

export function ServerSummary() {
  const { data: servers, isLoading } = useServerList();

  const serverCount = servers?.length ?? 0;
  const stdioCount =
    servers?.filter((s) => s.transport.type === "stdio").length ?? 0;
  const sseCount =
    servers?.filter((s) => s.transport.type === "sse").length ?? 0;

  const getSubtitle = () => {
    if (serverCount === 0) return "No servers installed yet";
    const parts: string[] = [];
    if (stdioCount > 0) parts.push(`${stdioCount} stdio`);
    if (sseCount > 0) parts.push(`${sseCount} SSE`);
    return parts.join(", ");
  };

  return (
    <SummaryCard
      title="Installed Servers"
      value={serverCount}
      subtitle={getSubtitle()}
      isLoading={isLoading}
      iconBgColor="bg-system-accent/10 dark:bg-system-accent/20"
      icon={
        <svg
          className="h-6 w-6 text-system-accent dark:text-system-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      }
      link="/servers"
      linkLabel="Manage servers"
    />
  );
}
