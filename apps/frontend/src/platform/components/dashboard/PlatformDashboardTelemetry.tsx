import React from "react";
import { Database, Zap, ShieldCheck, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { itemVariants } from "@/platform/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export function PlatformDashboardTelemetry(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <motion.div
      variants={reducedMotion ? undefined : itemVariants}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
    >
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.dbPoolLoad')}</span>
          <Database className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xl font-black font-mono text-foreground">12%</p>
        <p className="text-3xs text-success font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> {t('platform.telemetry.activeConns', { active: 8, total: 64 })}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.apiLatency')}</span>
          <Zap className="w-4 h-4 text-warning" />
        </div>
        <p className="text-xl font-black font-mono text-foreground">14ms</p>
        <p className="text-3xs text-success font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> {t('platform.telemetry.fastResponse')}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.securityBoundary')}</span>
          <ShieldCheck className="w-4 h-4 text-success" />
        </div>
        <p className="text-xl font-black font-mono text-foreground">{t('platform.telemetry.rls100')}</p>
        <p className="text-3xs text-muted-foreground font-medium">{t('platform.telemetry.tenantIsolated')}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold">{t('platform.telemetry.clusterMemory')}</span>
          <HardDrive className="w-4 h-4 text-secondary" />
        </div>
        <p className="text-xl font-black font-mono text-foreground">340MB</p>
        <p className="text-3xs text-muted-foreground font-medium">{t('platform.telemetry.nodejsRss')}</p>
      </div>
    </motion.div>
  );
}
