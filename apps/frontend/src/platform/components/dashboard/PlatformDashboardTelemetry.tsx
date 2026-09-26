import React, { useState } from "react";
import { Database, Zap, ShieldCheck, HardDrive, RefreshCw, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { itemVariants } from "@/platform/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformTelemetry } from "@/platform/hooks/usePlatformTelemetry";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { Button } from "@/components/ui/button";

export function PlatformDashboardTelemetry(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const [isPaused, setIsPaused] = useState(false);

  const {
    data: telemetry,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = usePlatformTelemetry({ refetchInterval: isPaused ? false : 30_000 });

  const dbPoolPct = telemetry ? `${telemetry.dbPool.utilizationRate}%` : "—";
  const activeConns = telemetry?.dbPool.activeCount ?? 0;
  const totalConns = telemetry?.dbPool.totalCount ?? 0;
  const latencyStr = telemetry ? `${telemetry.latencyMs}ms` : "—";
  const memoryStr = telemetry ? `${telemetry.memory.rssMb}MB` : "—";

  const formattedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <motion.div
      variants={reducedMotion ? undefined : itemVariants}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                isPaused
                  ? "bg-warning"
                  : isFetching
                    ? "bg-primary animate-ping"
                    : "bg-success animate-pulse"
              }`}
              aria-hidden
            />
            <span className="font-bold text-foreground">
              {isPaused ? t("platform.telemetry.pollingPaused") : t("platform.telemetry.livePolling")}
            </span>
          </span>

          {formattedTime && (
            <span className="text-3xs font-mono text-muted-foreground/80 bg-muted/40 border border-border/40 px-2 py-0.5 rounded-md">
              {t("platform.telemetry.lastUpdated", { time: formattedTime })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPaused((prev) => !prev)}
            className="min-h-11 h-11 px-3 text-xs font-semibold gap-1.5 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
            title={isPaused ? t("platform.telemetry.resumePolling") : t("platform.telemetry.pausePolling")}
            aria-label={isPaused ? t("platform.telemetry.resumePolling") : t("platform.telemetry.pausePolling")}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-success" aria-hidden />
            ) : (
              <Pause className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            )}
            <span>{isPaused ? t("platform.telemetry.resumePolling") : t("platform.telemetry.pausePolling")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="min-h-11 min-w-11 h-11 w-11 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
            title={t("platform.telemetry.refreshNow")}
            aria-label={t("platform.telemetry.refreshNow")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : "text-muted-foreground"}`} aria-hidden />
          </Button>
        </div>
      </div>

      <ModuleCommandMetricsGrid
        items={[
          {
            icon: Database,
            label: t("platform.telemetry.dbPoolLoad"),
            value: isLoading ? "…" : dbPoolPct,
            sub: t("platform.telemetry.activeConns", { active: activeConns, total: totalConns }),
            accent: "primary",
          },
          {
            icon: Zap,
            label: t("platform.telemetry.apiLatency"),
            value: isLoading ? "…" : latencyStr,
            sub: t("platform.telemetry.fastResponse"),
            accent: "warning",
          },
          {
            icon: ShieldCheck,
            label: t("platform.telemetry.securityBoundary"),
            value: t("platform.telemetry.rls100"),
            sub: t("platform.telemetry.tenantIsolated"),
            accent: "success",
          },
          {
            icon: HardDrive,
            label: t("platform.telemetry.clusterMemory"),
            value: isLoading ? "…" : memoryStr,
            sub: t("platform.telemetry.nodejsRss"),
            accent: "secondary",
          },
        ]}
      />
    </motion.div>
  );
}
