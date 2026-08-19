import React from "react";
import { Globe, ShieldCheck, BarChart3, TrendingUp, CheckCircle2, ShieldAlert, Award } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { usePlatformWorkspaces } from "@/platform/hooks/usePlatformWorkspaces";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";
import { StatsSkeleton } from "@/components/ui/LoadingState";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { containerVariantsConsole, itemVariants } from "@/platform/lib/animations";
import { cn } from "@/lib/utils";

export function PlatformReports(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard } = usePlatformPermissions();
  const { data: workspaces, isLoading: workspacesLoading, isError: workspacesError } = usePlatformWorkspaces();

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => w.enabled === false).length ?? 0;
  const activeRate = totalWorkspaces > 0 ? Math.round((activeWorkspaces / totalWorkspaces) * 100) : 0;
  const metricsReady = !workspacesLoading && !workspacesError && workspaces !== undefined;

  const chartData = [
    { name: t("platform.workspaceActive"), value: activeWorkspaces, color: "hsl(var(--success))" },
    { name: t("platform.workspaceInactive"), value: disabledWorkspaces, color: "hsl(var(--destructive))" },
  ];

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariantsConsole}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-6 text-start"
    >
      {/* 1. Command Analytics Metrics Grid */}
      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        {workspacesError ? null : metricsReady ? (
          <ModuleCommandMetricsGrid
            items={[
              {
                icon: Globe,
                label: t("platform.workspaceActive"),
                value: `${activeWorkspaces} / ${totalWorkspaces}`,
                accent: "primary",
              },
              {
                icon: TrendingUp,
                label: t("platform.activationRate"),
                value: `${activeRate}%`,
                accent: "success",
              },
              {
                icon: ShieldCheck,
                label: t("platform.roleSuperUser"),
                value: platformUser?.name ?? t("platform.operatorRole"),
                accent: "warning",
              },
            ]}
          />
        ) : (
          <StatsSkeleton count={3} />
        )}
      </motion.div>

      {/* 2. Detailed Analytics Visualizers */}
      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Activation Distribution Chart */}
          <WidgetCard className="p-6 space-y-4">
            <WidgetCardHeader
              icon={<BarChart3 className="w-4 h-4 text-primary" />}
              title={t("platform.workspaceDistribution")}
              subtitle={t("platform.visualizerSubtitle")}
            />

            <div className="h-64 w-full flex flex-col items-center justify-center">
              {totalWorkspaces === 0 ? (
                <p className="text-xs text-muted-foreground">{t("apex.noMadrasasYet")}</p>
              ) : (
                <SafeResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        boxShadow: "var(--shadow-surface)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-xs font-semibold text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </SafeResponsiveContainer>
              )}
            </div>
          </WidgetCard>

          {/* Operator Audit & Identity Summary */}
          <WidgetCard className="p-6 space-y-4">
            <WidgetCardHeader
              icon={<ShieldCheck className="w-4 h-4 text-success" />}
              title={t("platform.operatorIdentityTitle")}
              subtitle={t("platform.operatorIdentitySub")}
            />

            <div className={cn(WORK_SURFACE_INNER, "p-5 space-y-4")}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-black tracking-tight text-foreground truncate">{platformUser?.name}</h4>
                  <p className="text-xs font-mono text-muted-foreground truncate">{platformUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-border/40 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("platform.roleLevel")}</span>
                  <span className="font-black text-primary flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                    {platformUser?.role === "super_user" ? t("platform.roleSuperUser") : t("platform.roleAdmin")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("platform.sessionStatus")}</span>
                  <span className="font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("platform.sessionAuthenticated")}
                  </span>
                </div>
              </div>

              {/* Granted Capabilities Badges */}
              <div className="pt-3 border-t border-border/40 space-y-2">
                <span className="text-3xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  {t("platform.capabilitiesLabel")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {canWorkspaces && (
                    <span className={cn(SEMANTIC_BADGE.primary, "px-2.5 py-0.5 rounded-full text-3xs font-bold")}>
                      {t("platform.manageMadrasas")}
                    </span>
                  )}
                  {canOnboard && (
                    <span className={cn(SEMANTIC_BADGE.success, "px-2.5 py-0.5 rounded-full text-3xs font-bold")}>
                      {t("platform.onboardCapability")}
                    </span>
                  )}
                  {isSuperUser && (
                    <span className={cn(SEMANTIC_BADGE.warning, "px-2.5 py-0.5 rounded-full text-3xs font-bold")}>
                      {t("platform.roleSuperUser")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
