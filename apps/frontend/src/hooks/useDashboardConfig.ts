import { useCallback } from 'react';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  type DashboardPreferences,
  type DashboardWidgetDto,
} from '@mms/shared';
import {
  useDashboardPreferencesQuery,
  useDashboardPreferencesMutation,
  useDashboardWidgetsQuery,
  useDashboardWidgetsMutation,
  useDashboardWidgetDeleteMutation,
} from '@/tenant/hooks/collections/dashboard';

export function loadDashboardPreferences(): DashboardPreferences {
  return DEFAULT_DASHBOARD_PREFERENCES;
}

export function useDashboardConfig() {
  const prefsQuery = useDashboardPreferencesQuery();
  const widgetsQuery = useDashboardWidgetsQuery();
  const prefsMutation = useDashboardPreferencesMutation();
  const widgetsMutation = useDashboardWidgetsMutation();
  const widgetDeleteMutation = useDashboardWidgetDeleteMutation();

  const prefs = prefsQuery.data ?? DEFAULT_DASHBOARD_PREFERENCES;
  const customWidgets: CustomWidget[] = widgetsQuery.data ?? [];

  const updateCustomWidgets = useCallback(
    (customWidgetsDraft: CustomWidget[]) => {
      widgetsMutation.mutate(customWidgetsDraft as DashboardWidgetDto[]);
    },
    [widgetsMutation],
  );

  const updatePref = useCallback(
    <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => {
      prefsMutation.mutate({ ...prefs, [key]: value });
    },
    [prefs, prefsMutation],
  );

  const toggleCardVisibility = useCallback(
    (cardId: string) => {
      const disabledCardIds = prefs.disabledCardIds;
      const updated = disabledCardIds.includes(cardId)
        ? disabledCardIds.filter((id) => id !== cardId)
        : [...disabledCardIds, cardId];
      updatePref('disabledCardIds', updated);
    },
    [prefs.disabledCardIds, updatePref],
  );

  const toggleWidgetPin = useCallback(
    (widgetId: string) => {
      const updated = customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: !widget.isPinnedToDashboard } : widget,
      );
      updateCustomWidgets(updated);
    },
    [customWidgets, updateCustomWidgets],
  );

  const unpinWidget = useCallback(
    (widgetId: string) => {
      const updated = customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: false } : widget,
      );
      updateCustomWidgets(updated);
    },
    [customWidgets, updateCustomWidgets],
  );

  const deleteWidget = useCallback(
    (widgetId: string) => {
      widgetDeleteMutation.mutate(widgetId);
    },
    [widgetDeleteMutation],
  );

  const saveWidget = useCallback(
    (savedWidget: CustomWidget) => {
      const exists = customWidgets.some((widget) => widget.id === savedWidget.id);
      const updated = exists
        ? customWidgets.map((widget) => (widget.id === savedWidget.id ? savedWidget : widget))
        : [...customWidgets, savedWidget];
      updateCustomWidgets(updated);
    },
    [customWidgets, updateCustomWidgets],
  );

  return {
    disabledCardIds: prefs.disabledCardIds,
    customWidgets,
    gridMode: prefs.gridMode,
    enrollmentChartType: prefs.enrollmentChartType,
    enrollmentChartColor: prefs.enrollmentChartColor,
    enrollmentChartPeriod: prefs.enrollmentChartPeriod,
    revenueChartType: prefs.revenueChartType,
    revenueChartColor: prefs.revenueChartColor,
    attendanceChartType: prefs.attendanceChartType,
    attendanceChartColor: prefs.attendanceChartColor,
    hasanatChartType: prefs.hasanatChartType,
    hasanatChartColor: prefs.hasanatChartColor,
    updateCustomWidgets,
    toggleCardVisibility,
    toggleWidgetPin,
    unpinWidget,
    deleteWidget,
    saveWidget,
    updatePref,
  };
}
