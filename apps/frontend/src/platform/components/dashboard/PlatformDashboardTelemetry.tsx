import React from "react";
import { Database, Zap, ShieldCheck, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { itemVariants } from "@/platform/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformTelemetry } from "@/platform/hooks/usePlatformTelemetry";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";

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
      initial={reducedMotion ? false : "hidden"}
      animate="show"
    >
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
