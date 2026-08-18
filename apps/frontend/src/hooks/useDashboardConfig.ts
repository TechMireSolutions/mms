import { useCallback, useEffect, useRef } from 'react';
import { DASHBOARD_MODULE_MANIFEST, DEFAULT_DASHBOARD_PREFERENCES, type DashboardPreferences } from '@mms/shared';
import { getOrInitializeCustomWidgets } from '@/lib/reports/widgetDefaults';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import {
  useDashboardPreferencesQuery,
  useDashboardPreferencesMutation,
  useDashboardWidgetsQuery,
  useDashboardWidgetsMutation,
  useDashboardWidgetDeleteMutation,
} from '@/tenant/hooks/collections/dashboard';

/**
 * One-time local→server seed: reads the legacy browser `kpi_custom_widgets` store once
 * (lazily, cached) so existing pin customizations migrate to the server on first load,
 * and brand-new workspaces seed the server with the default widget set. Server is SSOT
 * after migration; localStorage is no longer read for display once the server has rows.
 */
let cachedMigrationSeed: CustomWidget[] | null = null;
function getMigrationSeedWidgets(): CustomWidget[] {
  if (cachedMigrationSeed === null) cachedMigrationSeed = getOrInitializeCustomWidgets();
  return cachedMigrationSeed;
}

export function useDashboardConfig() {
  const prefsQuery = useDashboardPreferencesQuery();
  const widgetsQuery = useDashboardWidgetsQuery();
  const prefsMutation = useDashboardPreferencesMutation();
  const widgetsMutation = useDashboardWidgetsMutation();
  const widgetDeleteMutation = useDashboardWidgetDeleteMutation();
  const { can } = usePermissions();
  const canWriteDashboard = can(DASHBOARD_MODULE_MANIFEST.permissions.setupWrite);

  const prefs: DashboardPreferences = prefsQuery.data ?? DEFAULT_DASHBOARD_PREFERENCES;
  const serverWidgets = widgetsQuery.data ?? [];
  const customWidgets: CustomWidget[] =
    serverWidgets.length > 0 ? serverWidgets : getMigrationSeedWidgets();

  // One-time local→server widget seed. Runs only when the server query has settled
  // empty AND the user may write — viewers keep the local fallback (read-only display).
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    if (widgetsQuery.status !== 'success') return;
    if (serverWidgets.length > 0 || !canWriteDashboard) {
      migratedRef.current = true;
      return;
    }
    migratedRef.current = true;
    widgetsMutation.mutate(getMigrationSeedWidgets());
  }, [widgetsQuery.status, serverWidgets.length, canWriteDashboard, widgetsMutation]);

  /** Full-array upsert (visualizer pin set + bulk flows). Upsert-only — never wipes absent rows. */
  const updateCustomWidgets = useCallback(
    (customWidgetsDraft: CustomWidget[]) => {
      widgetsMutation.mutate(customWidgetsDraft);
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

  /** Upsert only the affected widget (inserts new, updates existing; leaves others untouched). */
  const saveWidget = useCallback(
    (savedWidget: CustomWidget) => {
      widgetsMutation.mutate([savedWidget]);
    },
    [widgetsMutation],
  );

  const toggleWidgetPin = useCallback(
    (widgetId: string) => {
      const target = customWidgets.find((widget) => widget.id === widgetId);
      if (!target) return;
      widgetsMutation.mutate([{ ...target, isPinnedToDashboard: !target.isPinnedToDashboard }]);
    },
    [customWidgets, widgetsMutation],
  );

  const unpinWidget = useCallback(
    (widgetId: string) => {
      const target = customWidgets.find((widget) => widget.id === widgetId);
      if (!target) return;
      widgetsMutation.mutate([{ ...target, isPinnedToDashboard: false }]);
    },
    [customWidgets, widgetsMutation],
  );

  /** Hard delete via `DELETE /:id` (never bulk-wipe PUT). */
  const deleteWidget = useCallback(
    (widgetId: string) => {
      widgetDeleteMutation.mutate(widgetId);
    },
    [widgetDeleteMutation],
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