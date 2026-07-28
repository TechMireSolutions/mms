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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium"
      >
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold cursor-default"
          >
            <CloudOff className="w-3 h-3" aria-hidden="true" />
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
