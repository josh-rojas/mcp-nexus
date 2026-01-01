import { useState, useCallback, useEffect } from "react";
import { runDoctor } from "../lib/tauri";
import type { DoctorReport } from "../types";

interface UseDoctorResult {
  report: DoctorReport | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasChecked: boolean;
}

// Cache the doctor report at module level so it persists across component mounts
let cachedReport: DoctorReport | null = null;
let lastCheckTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useDoctor(autoCheck = false): UseDoctorResult {
  const [report, setReport] = useState<DoctorReport | null>(cachedReport);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(cachedReport !== null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runDoctor();
      cachedReport = result;
      lastCheckTime = Date.now();
      setReport(result);
      setHasChecked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run doctor");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-check on mount if requested and cache is stale/empty
  useEffect(() => {
    if (autoCheck && !isLoading) {
      const cacheIsStale =
        !lastCheckTime || Date.now() - lastCheckTime > CACHE_DURATION_MS;
      if (!cachedReport || cacheIsStale) {
        refresh();
      }
    }
  }, [autoCheck, refresh, isLoading]);

  return {
    report,
    isLoading,
    error,
    refresh,
    hasChecked,
  };
}

// Helper to determine what runtime a server source requires
export type RuntimeRequirement = "node" | "python" | "docker" | "none";

export function getServerRuntimeRequirement(
  sourceType: string
): RuntimeRequirement {
  switch (sourceType) {
    case "npm":
      return "node";
    case "uvx":
      return "python";
    case "docker":
      return "docker";
    case "local":
    case "remote":
    case "github":
    default:
      return "none";
  }
}
