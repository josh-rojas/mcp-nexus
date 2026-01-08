import { useDoctor } from "../../hooks/useDoctor";

export function EnvironmentSummary() {
  const { report, isLoading, hasChecked, refresh } = useDoctor(true);

  const getStatus = () => {
    if (!hasChecked) return { value: "?", color: "text-gray-400" };
    if (!report) return { value: "?", color: "text-gray-400" };

    const errorCount = report.issues.filter(
      (i) => i.severity === "error"
    ).length;
    const warningCount = report.issues.filter(
      (i) => i.severity === "warning"
    ).length;

    if (errorCount > 0) return { value: errorCount, color: "text-red-600" };
    if (warningCount > 0)
      return { value: warningCount, color: "text-amber-600" };
    return { value: "OK", color: "text-green-600" };
  };

  const getSubtitle = () => {
    if (!hasChecked) return "Not checked yet";
    if (!report) return "Check environment";

    const runtimes: string[] = [];
    if (report.node) runtimes.push("Node.js");
    if (report.python) runtimes.push("Python");
    if (report.docker) runtimes.push("Docker");

    if (runtimes.length === 0) return "No runtimes found";

    const errorCount = report.issues.filter(
      (i) => i.severity === "error"
    ).length;
    if (errorCount > 0) return `${errorCount} issue${errorCount > 1 ? "s" : ""} found`;

    return runtimes.join(", ");
  };

  const status = getStatus();

  const getIconBgColor = () => {
    if (!hasChecked) return "bg-gray-100 dark:bg-gray-700";
    const errorCount =
      report?.issues.filter((i) => i.severity === "error").length ?? 0;
    const warningCount =
      report?.issues.filter((i) => i.severity === "warning").length ?? 0;

    if (errorCount > 0) return "bg-red-100 dark:bg-red-900/30";
    if (warningCount > 0) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };

  const getIconColor = () => {
    if (!hasChecked) return "text-gray-400";
    const errorCount =
      report?.issues.filter((i) => i.severity === "error").length ?? 0;
    const warningCount =
      report?.issues.filter((i) => i.severity === "warning").length ?? 0;

    if (errorCount > 0) return "text-red-600 dark:text-red-400";
    if (warningCount > 0) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Environment
          </h3>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className={`text-3xl font-bold ${status.color} mt-1`}>
              {status.value}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getSubtitle()}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${getIconBgColor()}`}>
          <svg
            className={`h-6 w-6 ${getIconColor()}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>
      <button
        onClick={refresh}
        disabled={isLoading}
        className="mt-4 inline-flex items-center text-sm font-medium text-system-accent hover:text-system-accent/80 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 mr-1"
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
          </>
        ) : (
          <>
            Run doctor
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
