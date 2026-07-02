import React, { useState, useEffect } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getSyncStatus, type SyncStatus } from "@/lib/db";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Displays a compact indicator of the current background server sync status.
 * Hidden when idle. Shows a spinner when syncing and a red badge with tooltip on error.
 *
 * @returns {React.JSX.Element | null} The sync status indicator, or null when idle.
 */
export default function SyncStatusBadge(): React.JSX.Element | null {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SyncStatus>).detail;
      setStatus(detail);
    };
    window.addEventListener("sync-status-change", handler);
    return () => window.removeEventListener("sync-status-change", handler);
  }, []);

  if (status === "idle") return null;

  if (status === "syncing") {
    return (
      <div
        aria-label="Syncing data to server"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Syncing…</span>
      </div>
    );
  }

  // status === 'error'
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="alert"
            aria-label="Sync error — changes may not be saved to server"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold cursor-default"
          >
            <CloudOff className="w-3 h-3" />
            <span className="hidden sm:inline">Sync error</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Could not save changes to server. Check your connection.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
