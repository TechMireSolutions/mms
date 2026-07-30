import { useState, useMemo, useCallback } from 'react';
import { DASHBOARD_MODULE_MANIFEST } from '@mms/shared';
import { resolveDashboardRole, widgetMatchesDashboardRole } from '@/lib/dashboardRole';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';
import { useDashboardMetricCards } from '@/tenant/features/dashboard/hooks/useDashboardMetricCards';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';
import { isSeededDashboardWidget } from '@/lib/dashboardWidgets';
import { useFinanceCurrency } from '@/hooks/useCurrency';

export function useDashboardPageController() {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { can } = usePermissions();
  const dashboardRole = useMemo(() => resolveDashboardRole(can), [can]);
  const globalSettings = useGlobalSettings();
  const enabledModules = useMemo(() => globalSettings.enabledModules || {}, [globalSettings.enabledModules]);

  const {
    disabledCardIds,
    customWidgets,
    updateCustomWidgets,
    toggleCardVisibility,
  } = useDashboardConfig();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [widgetBuilderType, setWidgetBuilderType] = useState<CustomWidget['widgetType']>('card');

  const canCustomize = can(DASHBOARD_MODULE_MANIFEST.permissions.customize);

  const dashboardData = useDashboardData(customWidgets, dashboardRole);
  const {
    invoices,
    attendanceRecords,
    sessions,
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [canCustomize, isEditMode],
  );

  const handleUnpinWidget = (widgetId: string) => {
    updateCustomWidgets(
      customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: false } : widget,
      ),
    );
  };

  const handleDeleteWidget = (widgetId: string) => {
    updateCustomWidgets(customWidgets.filter((widget) => widget.id !== widgetId));
  };

  const handleEditWidget = (widget: CustomWidget) => {
    openWidgetBuilder(widget.widgetType || 'kpi', widget);
  };

  const toggleWidgetPin = (widgetId: string) => {
    updateCustomWidgets(
      customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: !widget.isPinnedToDashboard } : widget,
      ),
    );
  };

  const handleSaveWidget = useCallback(
    (savedWidget: CustomWidget) => {
      const widgetAlreadyExists = customWidgets.some((widget) => widget.id === savedWidget.id);
      const nextWidgets = widgetAlreadyExists
        ? customWidgets.map((widget) => (widget.id === savedWidget.id ? savedWidget : widget))
        : [...customWidgets, savedWidget];
      updateCustomWidgets(nextWidgets);
      closeBuilder();
    },
    [closeBuilder, customWidgets, updateCustomWidgets],
  );

  const activeCustomCards = useMemo(
    () =>
      customWidgets.filter(
        (widget) =>
          widget.widgetType === 'card' &&
          widgetMatchesDashboardRole(widget.role, dashboardRole) &&
          !isSeededDashboardWidget(widget.id),
      ),
    [customWidgets, dashboardRole],
  );

  const dashboardMetricCards = useDashboardMetricCards({
    customWidgets,
    dashboardRole,
    enabledModules,
    data: dashboardData,
    t,
  });

  const selectedDashboardCardCount = useMemo(
    () =>
      dashboardMetricCards.filter((dashboardCard) => !disabledCardIds.includes(dashboardCard.id))
        .length,
    [dashboardMetricCards, disabledCardIds],
  );

  const visibleDashboardMetricCards = useMemo(
    () => dashboardMetricCards.filter((dashboardCard) => !disabledCardIds.includes(dashboardCard.id)),
    [dashboardMetricCards, disabledCardIds],
  );

  const pinnedDashboardWidgetCount = customWidgets.filter((widget) => widget.isPinnedToDashboard).length;

  const notifications = useMemo(
    () =>
      buildDashboardNotifications(
        dashboardRole,
        { invoices, attendanceRecords, inactiveStudents: studentMetricsInactive },
        t,
        formatCurrency,
        can,
      ),
    [dashboardRole, invoices, attendanceRecords, studentMetricsInactive, t, formatCurrency, can],
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
    handleDeleteWidget,
    handleUnpinWidget,
    toggleWidgetPin,
    openWidgetBuilder,
    activeCustomCards,
    dashboardMetricCards,
    selectedDashboardCardCount,
    visibleDashboardMetricCards,
    pinnedDashboardWidgetCount,
    notifications,
    sessions,
    studentMetricsActive,
  };
}
