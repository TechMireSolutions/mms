import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { resolveDashboardRole } from "@/lib/dashboardRole";
import { useDashboardData } from "@/tenant/features/dashboard/hooks/useDashboardData";
import { buildDashboardNotifications } from "@/lib/buildDashboardNotifications";
import { ROUTES } from "@/lib/config/routes";

export function TenantNotificationsPopover(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { formatCurrency } = useFinanceCurrency();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const dashboardRole = resolveDashboardRole(can);
  const {
    financeMetrics,
    attendanceMetrics,
    studentMetricsInactive,
  } = useDashboardData([], dashboardRole);

  const notifications = buildDashboardNotifications(
    dashboardRole,
    {
      outstandingInvoiceCount: financeMetrics?.outstanding ?? 0,
      outstandingBalance: financeMetrics?.outstandingBalance ?? 0,
      attendanceRate:
        attendanceMetrics?.selectedDatePresentRate
        ?? attendanceMetrics?.overallPresentRate
        ?? null,
      inactiveStudents: studentMetricsInactive,
    },
    t,
    formatCurrency,
  );

  const unreadCount = notifications.length;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("notifications.title")}
          className="relative min-h-11 min-w-11 h-11 w-11 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5 text-muted-foreground" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-popover-menu max-w-full p-0">
        {popoverOpen && (
          <>
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-foreground/75 font-medium">
                  {t("notifications.empty")}
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border-b border-border/50 px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="mt-0.5 text-xs text-foreground/80">{notification.desc}</p>
                        <p className="mt-1 text-xs text-foreground/75 font-medium">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPopoverOpen(false);
                  navigate(ROUTES.home);
                }}
                className="w-full justify-center text-xs font-semibold text-foreground hover:text-primary hover:bg-muted/60 min-h-11 px-3"
              >
                {t("notifications.viewAll")}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
