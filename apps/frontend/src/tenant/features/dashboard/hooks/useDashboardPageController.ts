import { useState, useMemo, useCallback } from 'react';
import { DASHBOARD_MODULE_MANIFEST } from '@mms/shared';
import { resolveDashboardRole } from '@/lib/dashboardRole';
import { getActiveCustomCardIds, getPinnedDashboardWidgetCount } from '@/lib/dashboardCollections';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';
import { useDashboardMetricCards } from '@/tenant/features/dashboard/hooks/useDashboardMetricCards';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { scrollDocumentToTop } from '@/lib/routing/scrollDocumentToTop';

export function useDashboardPageController() {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { can } = usePermissions();
  const dashboardRole = useMemo(() => resolveDashboardRole(can), [can]);
  const globalSettings = useGlobalSettings();
  const enabledModules = globalSettings.enabledModules || {};

  const {
    disabledCardIds,
    customWidgets,
    toggleCardVisibility,
    toggleWidgetPin,
    unpinWidget,
    deleteWidget,
    saveWidget,
  } = useDashboardConfig();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [widgetBuilderType, setWidgetBuilderType] = useState<CustomWidget['widgetType']>('card');

  const canCustomize = can(DASHBOARD_MODULE_MANIFEST.permissions.customize);

  const dashboardData = useDashboardData(customWidgets, dashboardRole);
  const {
    financeMetrics,
    attendanceMetrics,
    sessionsMetrics,
    studentMetricsInactive,
    studentMetricsActive,
  } = dashboardData;

  const closeBuilder = useCallback(() => {
    setIsWidgetBuilderOpen(false);
    setEditingWidget(null);
  }, []);

  const openWidgetBuilder = useCallback(
    (type: CustomWidget['widgetType'], widget: CustomWidget | null = null) => {
      if (!canCustomize) return;
      if (!isEditMode) setIsEditMode(true);
      setEditingWidget(widget);
      setWidgetBuilderType(type);
      setIsWidgetBuilderOpen(true);
      scrollDocumentToTop({ behavior: 'smooth' });
    },
    [canCustomize, isEditMode],
  );

  const handleEditWidget = useCallback(
    (widget: CustomWidget) => {
      openWidgetBuilder(widget.widgetType || 'kpi', widget);
    },
    [openWidgetBuilder],
  );

  const handleSaveWidget = useCallback(
    (savedWidget: CustomWidget) => {
      saveWidget(savedWidget);
      closeBuilder();
    },
    [closeBuilder, saveWidget],
  );

  const activeCustomCardIds = useMemo(
    () => getActiveCustomCardIds(customWidgets, dashboardRole),
    [customWidgets, dashboardRole],
  );

  const dashboardMetricCards = useDashboardMetricCards({
    customWidgets,
    dashboardRole,
    enabledModules,
    data: dashboardData,
    t,
  });

  const handleEditCustomCard = useCallback(
    (customCardId: string) => {
      const widget = customWidgets.find((dashboardWidget) => dashboardWidget.id === customCardId);
      if (widget) handleEditWidget(widget);
    },
    [customWidgets, handleEditWidget],
  );

  const visibleDashboardMetricCards = useMemo(
    () => dashboardMetricCards.filter((dashboardCard) => !disabledCardIds.includes(dashboardCard.id)),
    [dashboardMetricCards, disabledCardIds],
  );

  const selectedDashboardCardCount = visibleDashboardMetricCards.length;

  const pinnedDashboardWidgetCount = useMemo(
    () => getPinnedDashboardWidgetCount(customWidgets),
    [customWidgets],
  );

  const notifications = useMemo(
    () =>
      buildDashboardNotifications(
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
        can,
      ),
    [dashboardRole, financeMetrics, attendanceMetrics, studentMetricsInactive, t, formatCurrency, can],
  );

  return {
    t,
    can,
    dashboardRole,
    canCustomize,
    isEditMode,
    setIsEditMode,
    customWidgets,
    disabledCardIds,
    toggleCardVisibility,
    isWidgetBuilderOpen,
    editingWidget,
    widgetBuilderType,
    closeBuilder,
    handleSaveWidget,
    handleEditWidget,
    handleEditCustomCard,
    handleDeleteWidget: deleteWidget,
    handleUnpinWidget: unpinWidget,
    toggleWidgetPin,
    openWidgetBuilder,
    activeCustomCardIds,
    dashboardMetricCards,
    selectedDashboardCardCount,
    visibleDashboardMetricCards,
    pinnedDashboardWidgetCount,
    notifications,
    activeSessionsCount: sessionsMetrics?.active ?? 0,
    studentMetricsActive,
  };
}
