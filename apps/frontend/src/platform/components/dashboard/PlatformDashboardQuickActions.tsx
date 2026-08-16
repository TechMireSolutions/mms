import React from "react";
import { Link } from "react-router-dom";
import { Activity, Building2, BarChart3, Server, UserPlus, Settings, Database } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { ROUTES } from "@/lib/config/routes";
import { cn } from "@/lib/utils";

export interface PlatformDashboardQuickActionsProps {
  canWorkspaces: boolean;
  isSuperUser: boolean;
}

export function PlatformDashboardQuickActions({
  canWorkspaces,
  isSuperUser,
}: PlatformDashboardQuickActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
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
  );
}
