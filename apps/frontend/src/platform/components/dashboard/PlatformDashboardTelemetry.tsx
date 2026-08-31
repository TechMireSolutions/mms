import React from "react";
import { Database, Zap, ShieldCheck, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { itemVariants } from "@/platform/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformTelemetry } from "@/platform/hooks/usePlatformTelemetry";

export function PlatformDashboardTelemetry(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const { data: telemetry, isLoading } = usePlatformTelemetry();

  const dbPoolPct = telemetry ? `${telemetry.dbPool.utilizationRate}%` : "—";
  const activeConns = telemetry?.dbPool.activeCount ?? 0;
  const totalConns = telemetry?.dbPool.totalCount ?? 0;
  const latencyStr = telemetry ? `${telemetry.latencyMs}ms` : "—";
  const memoryStr = telemetry ? `${telemetry.memory.rssMb}MB` : "—";

  return (
    <motion.div
      variants={reducedMotion ? undefined : itemVariants}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
    >
      <div className="group/telemetry relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 space-y-1.5 text-start">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.dbPoolLoad')}</span>
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/telemetry:scale-110 transition-transform">
            <Database className="w-3.5 h-3.5" aria-hidden />
          </div>
        </div>
        <p className="text-2xl font-black font-mono tracking-tight text-foreground">
          {isLoading ? <span className="animate-pulse opacity-50">...</span> : dbPoolPct}
        </p>
        <p className="text-3xs text-success font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />{" "}
          {t('platform.telemetry.activeConns', { active: activeConns, total: totalConns })}
        </p>
      </div>

      <div className="group/telemetry relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-xs hover:shadow-md hover:border-warning/30 transition-all duration-300 space-y-1.5 text-start">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.apiLatency')}</span>
          <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center text-warning group-hover/telemetry:scale-110 transition-transform">
            <Zap className="w-3.5 h-3.5" aria-hidden />
          </div>
        </div>
        <p className="text-2xl font-black font-mono tracking-tight text-foreground">
          {isLoading ? <span className="animate-pulse opacity-50">...</span> : latencyStr}
        </p>
        <p className="text-3xs text-success font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />{" "}
          {t('platform.telemetry.fastResponse')}
        </p>
      </div>

      <div className="group/telemetry relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-xs hover:shadow-md hover:border-success/30 transition-all duration-300 space-y-1.5 text-start">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.securityBoundary')}</span>
          <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center text-success group-hover/telemetry:scale-110 transition-transform">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
          </div>
        </div>
        <p className="text-2xl font-black font-mono tracking-tight text-foreground">{t('platform.telemetry.rls100')}</p>
        <p className="text-3xs text-muted-foreground font-medium">{t('platform.telemetry.tenantIsolated')}</p>
      </div>

      <div className="group/telemetry relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-xs hover:shadow-md hover:border-secondary/30 transition-all duration-300 space-y-1.5 text-start">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.clusterMemory')}</span>
          <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary-foreground group-hover/telemetry:scale-110 transition-transform">
            <HardDrive className="w-3.5 h-3.5" aria-hidden />
          </div>
        </div>
        <p className="text-2xl font-black font-mono tracking-tight text-foreground">
          {isLoading ? <span className="animate-pulse opacity-50">...</span> : memoryStr}
        </p>
        <p className="text-3xs text-muted-foreground font-medium">{t('platform.telemetry.nodejsRss')}</p>
      </div>
    </motion.div>
  );
}
