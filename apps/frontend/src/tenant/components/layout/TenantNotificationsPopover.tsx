import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { resolveDashboardRole } from "@/lib/dashboardRole";
import { useDashboardData } from "@/tenant/features/dashboard/hooks/useDashboardData";
import { buildDashboardNotifications } from "@/lib/buildDashboardNotifications";
import { NotificationsPopover, type NotificationItem } from "@/components/ui/NotificationsPopover";
import { ROUTES } from "@/lib/config/routes";

/**
 * Tenant notifications popover delegating presentation to universal NotificationsPopover primitive.
 */
export function TenantNotificationsPopover(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { formatCurrency } = useFinanceCurrency();

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

  const notificationItems: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    desc: n.desc,
    time: n.time,
  }));

  return (
    <NotificationsPopover
      notifications={notificationItems}
      title={t("notifications.title")}
      emptyText={t("notifications.empty")}
      ariaLabel={t("notifications.title")}
      viewAllLabel={t("notifications.viewAll")}
      onViewAll={() => navigate(ROUTES.home)}
    />
  );
}
