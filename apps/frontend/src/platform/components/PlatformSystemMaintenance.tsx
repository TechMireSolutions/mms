import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Database, Activity, Cpu, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/utils";
import { containerVariantsConsole as containerVariants, itemVariants as cardVariants } from "@/platform/lib/animations";
import { PlatformMigrateRestartCard } from "@/platform/pages/account/PlatformMigrateRestartCard";
import { PlatformResetDatabaseCard } from "@/platform/pages/account/PlatformResetDatabaseCard";

export function PlatformSystemMaintenance(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [probing, setProbing] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const runHealthProbe = useCallback(async () => {
    setProbing(true);
    const start = performance.now();
    try {
      const res = await apiFetch("/ready", { cache: "no-store" });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setLatencyMs(elapsed);
      } else {
        setLatencyMs(null);
      }
    } catch {
      setLatencyMs(null);
    } finally {
      setProbing(false);
      setLastChecked(formatDateTime(new Date().toISOString()));
    }
  }, []);

  useEffect(() => {
    void runHealthProbe();
  }, [runHealthProbe]);

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariants}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-6 text-start"
    >
      {/* System Maintenance Header Metrics */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          variant="compact"
          label={t("platform.dbEngine")}
          value="PostgreSQL 16"
          sub="RLS Enabled"
          icon={Database}
          accent="primary"
        />
        <StatCard
          variant="compact"
          label={t("platform.wsBroadcaster")}
          value="Fastify WebSocket"
          sub="In-Process"
          icon={Activity}
          accent="success"
        />
        <StatCard
          variant="compact"
          label={t("platform.contextStorage")}
          value="Node ALS"
          sub="AsyncLocalStorage"
          icon={Cpu}
          accent="warning"
        />
        <StatCard
          variant="compact"
          label={t("platform.maintenance.ping")}
          value={latencyMs !== null ? `${latencyMs} ms` : "Probing..."}
          sub={lastChecked ? `Checked: ${lastChecked}` : t("platform.statusOperational")}
          icon={Zap}
          accent={latencyMs !== null && latencyMs < 200 ? "success" : "primary"}
        />
      </motion.div>

      {/* Maintenance Action Cards */}
      <motion.div variants={cardVariants} className="space-y-6">
        <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" />
            <span className="font-bold text-foreground">{t("platform.maintenance.preflightCheck")}</span>
            <span className="text-muted-foreground">{t("platform.maintenance.systemsReady")}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-3xs text-muted-foreground shrink-0">
            <span className="bg-card px-2 py-0.5 rounded border border-border/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {t("platform.maintenance.dbConnsHealthy")}
            </span>
            <span className="bg-card px-2 py-0.5 rounded border border-border/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {t("platform.maintenance.pm2Active")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void runHealthProbe()}
              disabled={probing}
              className="h-6 px-2 text-3xs font-bold gap-1 rounded-md cursor-pointer"
              title={t("platform.maintenance.runDiagnostics")}
            >
              <RefreshCw className={probing ? "w-3 h-3 animate-spin" : "w-3 h-3"} aria-hidden />
              {probing ? t("platform.maintenance.diagnosticsRunning") : t("platform.maintenance.runDiagnostics")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <PlatformMigrateRestartCard />
          <PlatformResetDatabaseCard />
        </div>
      </motion.div>
    </motion.div>
  );
}

