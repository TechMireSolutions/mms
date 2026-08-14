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
          value="Redis 7"
          sub="Pub/Sub Cluster"
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
      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <PlatformMigrateRestartCard />
          <PlatformResetDatabaseCard />
        </div>
      </motion.div>
    </motion.div>
  );
}
