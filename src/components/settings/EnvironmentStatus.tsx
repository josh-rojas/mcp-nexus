import { useState } from "react";
import { runDoctor } from "../../lib/tauri";
import type { DoctorReport, VersionInfo, DoctorIssue } from "../../types";

interface RuntimeRowProps {
  name: string;
  info?: VersionInfo;
  isLoading: boolean;
  hasChecked: boolean;
}

function RuntimeRow({ name, info, isLoading, hasChecked }: RuntimeRowProps) {
  const getStatusDisplay = () => {
    if (isLoading) {
      return (
        <span className="flex items-center text-gray-400">
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Checking...
        </span>
      );
    }

    if (!hasChecked) {
      return <span className="text-gray-500">Not checked</span>;
    }

    if (info) {
      return (
        <span className="flex items-center text-green-600 dark:text-green-400">
          <svg
            className="h-4 w-4 mr-1"
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
          v{info.version}
        </span>
      );
    }

    return (
      <span className="flex items-center text-amber-600 dark:text-amber-400">
        <svg
          className="h-4 w-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Not found
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex flex-col">
        <span className="text-gray-700 dark:text-gray-300">{name}</span>
        {info?.path && (
          <span className="text-xs text-gray-400 font-mono truncate max-w-xs">
            {info.path}
          </span>
        )}
      </div>
      {getStatusDisplay()}
    </div>
  );
}

interface IssueItemProps {
  issue: DoctorIssue;
}

function IssueItem({ issue }: IssueItemProps) {
  const getSeverityStyles = () => {
    switch (issue.severity) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
    }
  };

  const getSeverityIcon = () => {
    switch (issue.severity) {
      case "error":
        return (
          <svg
            className="h-4 w-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="h-4 w-4 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="h-4 w-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityStyles()}`}>
      <div className="flex items-start gap-2">
        {getSeverityIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-sm mt-1 opacity-80">{issue.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnvironmentStatus() {
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunDoctor = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runDoctor();
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run doctor");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChecked = report !== null;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Environment Check
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Verify that all required dependencies are installed for MCP servers
      </p>

      <button
        onClick={handleRunDoctor}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading ? "Checking..." : "Run Doctor"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-1">
        <RuntimeRow
          name="Node.js"
          info={report?.node}
          isLoading={isLoading}
          hasChecked={hasChecked}
        />
        <RuntimeRow
          name="Python"
          info={report?.python}
          isLoading={isLoading}
          hasChecked={hasChecked}
        />
        <RuntimeRow
          name="uv"
          info={report?.uv}
          isLoading={isLoading}
          hasChecked={hasChecked}
        />
        <RuntimeRow
          name="Docker"
          info={report?.docker}
          isLoading={isLoading}
          hasChecked={hasChecked}
        />
        <RuntimeRow
          name="git"
          info={report?.git}
          isLoading={isLoading}
          hasChecked={hasChecked}
        />
      </div>

      {report && report.issues.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Issues ({report.issues.length})
          </h3>
          {report.issues.map((issue, index) => (
            <IssueItem key={index} issue={issue} />
          ))}
        </div>
      )}

      {hasChecked && report && report.issues.length === 0 && (
        <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center">
          <svg
            className="h-4 w-4 mr-2"
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
          All environment checks passed!
        </div>
      )}
    </section>
  );
}
