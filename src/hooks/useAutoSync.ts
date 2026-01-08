// src/hooks/useAutoSync.ts
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncAllClients } from "../lib/tauri";
import { useConfig } from "./useConfig";
import { notifySyncAllError } from "../lib/notifications";

const AUTO_SYNC_DEBOUNCE_MS = 1000;

export function useAutoSync() {
  const { data: config } = useConfig();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  const triggerAutoSync = useCallback(() => {
    if (!config?.preferences.autoSyncOnChanges) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(async () => {
      timeoutRef.current = null;

      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const result = await syncAllClients();
        queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });

        if (result.failed > 0) {
          notifySyncAllError(
            new Error(
              `Auto-sync completed with ${result.failed} client failure(s). See logs at ~/.mcp-nexus/logs/auto-sync.log.`
            )
          );
        }
      } catch (err) {
        notifySyncAllError(err);
      } finally {
        isSyncingRef.current = false;
      }
    }, AUTO_SYNC_DEBOUNCE_MS);
  }, [config?.preferences.autoSyncOnChanges, queryClient]);

  return { triggerAutoSync };
}

