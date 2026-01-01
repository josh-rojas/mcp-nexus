import { useState } from "react";
import type { HealthStatus } from "../../types";

interface HealthIndicatorProps {
  status: HealthStatus;
  message?: string;
  responseTimeMs?: number;
  className?: string;
}

export function HealthIndicator({
  status,
  message,
  responseTimeMs,
  className = "",
}: HealthIndicatorProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "healthy":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
      case "unhealthy":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700";
      case "running":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "stopped":
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600";
      case "unknown":
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "healthy":
        return "●";
      case "unhealthy":
        return "●";
      case "running":
        return "▶";
      case "stopped":
        return "■";
      case "unknown":
      default:
        return "?";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "unhealthy":
        return "Unhealthy";
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      case "unknown":
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border ${getStatusStyles()}`}
        title={message || undefined}
      >
        <span className="text-sm leading-none">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {responseTimeMs !== undefined && status === "healthy" && (
          <span className="ml-1 opacity-70">({responseTimeMs}ms)</span>
        )}
      </span>
      {message && status !== "healthy" && (
        <span className="text-xs text-gray-500 dark:text-gray-400" title={message}>
          {message.length > 50 ? `${message.substring(0, 50)}...` : message}
        </span>
      )}
    </div>
  );
}

interface TestConnectionButtonProps {
  serverId: string;
  onTest: (serverId: string) => Promise<void>;
  className?: string;
}

export function TestConnectionButton({
  serverId,
  onTest,
  className = "",
}: TestConnectionButtonProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTest(serverId);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={isTesting}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className} ${
        isTesting
          ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {isTesting ? (
        <>
          <span className="inline-block animate-spin mr-2">⟳</span>
          Testing...
        </>
      ) : (
        "Test Connection"
      )}
    </button>
  );
}
