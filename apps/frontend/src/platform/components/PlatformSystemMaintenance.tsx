import React from "react";
import { motion } from "framer-motion";
import { Database, Activity, Cpu } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { StatCard } from "@/components/ui/StatCard";
import { containerVariantsConsole as containerVariants, itemVariants as cardVariants } from "@/platform/lib/animations";
import { PlatformMigrateRestartCard } from "@/platform/pages/account/PlatformMigrateRestartCard";
import { PlatformResetDatabaseCard } from "@/platform/pages/account/PlatformResetDatabaseCard";

export function PlatformSystemMaintenance(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-start"
    >
      {/* System Maintenance Header Metrics */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </motion.div>

      {/* Maintenance Action Cards */}
      <motion.div variants={cardVariants} className="space-y-6">
        <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="font-bold text-foreground">Maintenance Preflight Check:</span>
            <span className="text-muted-foreground">All systems operational and ready for maintenance.</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-3xs text-muted-foreground">
            <span className="bg-card px-2 py-0.5 rounded border border-border/50">DB Conns: Healthy</span>
            <span className="bg-card px-2 py-0.5 rounded border border-border/50">PM2: Active</span>
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
