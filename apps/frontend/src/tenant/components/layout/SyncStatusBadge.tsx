import React, { useState, useEffect } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getSyncStatus, type SyncStatus } from "@/lib/db";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Displays a compact indicator of the current background server sync status.
 * Hidden when idle. Shows a spinner when syncing and a red badge with tooltip on error.
 */
export default function SyncStatusBadge(): React.JSX.Element | null {
  const { t } = useTranslation();
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
        aria-label={t("sync.status.syncingAria")}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <span className="hidden sm:inline">{t("sync.status.syncing")}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="alert"
            aria-label={t("sync.status.errorAria")}
            className="inline-flex min-h-11 min-w-11 cursor-default items-center justify-center gap-1.5 rounded-full bg-destructive/10 px-2.5 text-xs font-semibold text-destructive"
          >
            <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("sync.status.error")}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{t("sync.status.errorTooltip")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
