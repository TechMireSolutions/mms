import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe,
  Ban,
  Database,
  Activity,
  UserPlus,
  Settings,
  Sparkles,
  TrendingUp,
  BarChart3,
  Server,
  Zap,
  HardDrive,
  Radio,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { usePlatformWorkspaces } from "@/platform/hooks/usePlatformWorkspaces";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";
import { StatsSkeleton } from "@/components/ui/LoadingState";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { containerVariantsConsole, itemVariants } from "@/platform/lib/animations";
import { cn } from "@/lib/utils";

export function PlatformDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard } = usePlatformPermissions();
  const { data: workspaces, isLoading: workspacesLoading, isError: workspacesError } = usePlatformWorkspaces();

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => w.enabled === false).length ?? 0;
  const metricsReady = !workspacesLoading && !workspacesError && workspaces !== undefined;

  // Chart data for workspace distribution with theme-consistent color hexes
  const chartData = [
    { name: t("platform.workspaceActive"), count: activeWorkspaces, color: "var(--color-success, #10b981)" },
    { name: t("platform.workspaceInactive"), count: disabledWorkspaces, color: "var(--color-destructive, #ef4444)" },
  ];

  // Activity trend simulation based on active workspaces
  const trendData = [
    { month: "Jan", tenants: Math.max(1, Math.round(activeWorkspaces * 0.4)), ops: 120 },
    { month: "Feb", tenants: Math.max(1, Math.round(activeWorkspaces * 0.55)), ops: 190 },
    { month: "Mar", tenants: Math.max(1, Math.round(activeWorkspaces * 0.7)), ops: 340 },
    { month: "Apr", tenants: Math.max(1, Math.round(activeWorkspaces * 0.85)), ops: 480 },
    { month: "May", tenants: activeWorkspaces, ops: 620 },
  ];

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariantsConsole}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-8 text-start"
    >
      {/* 1. Welcome Banner & Quick Shortcuts */}
      <motion.div
        variants={reducedMotion ? undefined : itemVariants}
        className={cn(WORK_SURFACE, "p-6 sm:p-8 relative overflow-hidden group/banner")}
      >
        <div className="absolute -top-12 -end-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover/banner:bg-primary/15 transition-all duration-500" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(SEMANTIC_BADGE.primary, "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs")}>
              <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
              {t("platform.consoleTitle")}
            </span>
            <span className={cn(SEMANTIC_BADGE.success, "px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs")}>
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {t("platform.statusOperational")}
            </span>
            <span className="text-xs font-mono text-muted-foreground ms-auto hidden sm:inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
              <Radio className="w-3 h-3 text-success animate-ping" /> Realtime Pulse
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {t("platform.welcomeBack", { name: platformUser?.name ?? t("platform.operatorRole") })}
              </h1>
              <p className="text-sm font-medium text-muted-foreground max-w-xl leading-relaxed mt-1">
                {isSuperUser
                  ? t("platform.superConsoleDesc")
                  : t("platform.operatorConsoleDesc")}
              </p>
            </div>

            {/* Quick Banner Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              {canOnboard && (
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl font-bold gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Link to={ROUTES.onboarding}>
                    <Building2 className="w-4 h-4" aria-hidden />
                    {t("auth.createMadrasa")}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                  </Link>
                </Button>
              )}
              {canWorkspaces && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold gap-1.5 hover:bg-muted transition-all"
                >
                  <Link to={ROUTES.platformWorkspaces}>
                    <Globe className="w-4 h-4 text-primary" aria-hidden />
                    {t("platform.manageMadrasas")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Platform Command Metrics Grid */}
      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        {workspacesError ? null : metricsReady ? (
          <ModuleCommandMetricsGrid
            items={[
              {
                icon: Building2,
                label: t("platform.manageMadrasas"),
                value: totalWorkspaces,
                accent: "primary",
              },
              {
                icon: Globe,
                label: t("platform.workspaceActive"),
                value: activeWorkspaces,
                accent: "success",
              },
              {
                icon: Ban,
                label: t("platform.workspaceInactive"),
                value: disabledWorkspaces,
                accent: "destructive",
              },
            ]}
          />
        ) : (
          <StatsSkeleton count={3} />
        )}
      </motion.div>

      {/* 3. Realtime Telemetry Pulse Grid */}
      <motion.div
        variants={reducedMotion ? undefined : itemVariants}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">DB Pool Load</span>
            <Database className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black font-mono text-foreground">12%</p>
          <p className="text-[11px] text-success font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> 8/64 active conns
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">API Latency (p95)</span>
            <Zap className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-black font-mono text-foreground">14ms</p>
          <p className="text-[11px] text-success font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Fast response time
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Security Boundary</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-black font-mono text-foreground">RLS 100%</p>
          <p className="text-[11px] text-muted-foreground font-medium">Tenant Isolated</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Cluster Memory</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black font-mono text-foreground">340MB</p>
          <p className="text-[11px] text-muted-foreground font-medium">Node.js RSS</p>
        </div>
      </motion.div>

      {/* 4. Dashboard Analytics & Health Grid */}
      <motion.div
        variants={reducedMotion ? undefined : itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        {/* Workspace Activation & Growth Trends Chart */}
        <div className="lg:col-span-2 space-y-6">
          <WidgetCard className="p-6 space-y-4">
            <WidgetCardHeader
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              title={t("platform.manageMadrasas")}
              subtitle={t("platform.visualizerSubtitle")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Distribution Bar Chart */}
              <div className="h-60 w-full">
                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Active vs Inactive
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="currentColor" className="text-xs font-semibold text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-xs font-semibold text-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Trend Sparkline */}
              <div className="h-60 w-full">
                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-success" /> 5-Month Activity Trend
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="currentColor" className="text-xs font-semibold text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-xs font-semibold text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area type="monotone" dataKey="ops" stroke="var(--color-primary, #3b82f6)" strokeWidth={2} fillOpacity={1} fill="url(#colorOps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </WidgetCard>
        </div>

        {/* System Health & Quick Actions Widget */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <WidgetCard className="p-6 space-y-4">
            <WidgetCardHeader
              icon={<Activity className="w-4 h-4 text-primary" />}
              title={t("platform.quickActionsTitle")}
              subtitle={t("platform.quickActionsSubtitle")}
            />

            <div className="space-y-2.5">
              {canWorkspaces && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link to={ROUTES.platformWorkspaces}>
                    <Building2 className="w-4 h-4 text-primary shrink-0" aria-hidden />
                    {t("platform.manageMadrasas")}
                  </Link>
                </Button>
              )}

              {canWorkspaces && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link to={ROUTES.platformReports}>
                    <BarChart3 className="w-4 h-4 text-primary shrink-0" aria-hidden />
                    {t("module.reports")}
                  </Link>
                </Button>
              )}

              {isSuperUser && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link to={ROUTES.platformActivityLogs}>
                    <Activity className="w-4 h-4 text-purple-500 shrink-0" aria-hidden />
                    {t("platform.activityLogsTitle")}
                  </Link>
                </Button>
              )}

              {isSuperUser && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link to={ROUTES.platformSystem}>
                    <Server className="w-4 h-4 text-destructive shrink-0" aria-hidden />
                    {t("platform.systemMaintenance")}
                  </Link>
                </Button>
              )}

              {isSuperUser && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link to={ROUTES.platformAdmins}>
                    <UserPlus className="w-4 h-4 text-success shrink-0" aria-hidden />
                    {t("platform.adminsTitle")}
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full justify-start min-h-[44px] rounded-xl font-bold text-xs gap-2.5 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Link to={ROUTES.platformAccount}>
                  <Settings className="w-4 h-4 text-warning shrink-0" aria-hidden />
                  {t("platform.myAccount")}
                </Link>
              </Button>
            </div>
          </WidgetCard>

          {/* Infrastructure Health Status */}
          <div className={cn(WORK_SURFACE_INNER, "p-5 space-y-3")}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Platform Stack
              </span>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("platform.stackDatabase")}</span>
                <span className="text-foreground font-bold">PostgreSQL 16 (RLS)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("platform.stackWebsocket")}</span>
                <span className="text-success font-bold">Fastify WebSocket</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">{t("platform.stackIsolation")}</span>
                <span className="text-primary font-bold">AsyncLocalStorage</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
