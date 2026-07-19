import { useCallback, useEffect } from 'react';
import { getObject, saveObject } from '@/lib/db';
import { getOrInitializeCustomWidgets } from '@/tenant/features/reports/components/pinnedWidgets/widgetDefaults';
import type { CustomWidget } from '@/tenant/features/reports/components/PinnedWidgets';
import { useLiveObject } from '@/hooks/useLiveObject';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  type DashboardPreferences,
  DASHBOARD_WIDGETS_KEY,
  DASHBOARD_PREFERENCES_KEY,
  DASHBOARD_DISABLED_CARDS_KEY,
  PINNED_WIDGETS_GRID_MODE_KEY,
  ENROLLMENT_CHART_TYPE_KEY,
  ENROLLMENT_CHART_COLOR_KEY,
  ENROLLMENT_CHART_PERIOD_KEY,
  REVENUE_CHART_TYPE_KEY,
  REVENUE_CHART_COLOR_KEY,
  ATTENDANCE_CHART_TYPE_KEY,
  ATTENDANCE_CHART_COLOR_KEY,
  HASANAT_CHART_TYPE_KEY,
  HASANAT_CHART_COLOR_KEY,
} from '@mms/shared';

export function loadDashboardPreferences(): DashboardPreferences {
  const unified = getObject<DashboardPreferences | null>(DASHBOARD_PREFERENCES_KEY, null);
  if (unified) {
    return { ...DEFAULT_DASHBOARD_PREFERENCES, ...unified };
  }

  // Fallback and migrate from legacy keys on first load
  return {
    disabledCardIds: getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, DEFAULT_DASHBOARD_PREFERENCES.disabledCardIds),
    gridMode: getObject<'comfortable' | 'compact'>(PINNED_WIDGETS_GRID_MODE_KEY, DEFAULT_DASHBOARD_PREFERENCES.gridMode),
    enrollmentChartType: getObject<'area' | 'bar' | 'line'>(ENROLLMENT_CHART_TYPE_KEY, DEFAULT_DASHBOARD_PREFERENCES.enrollmentChartType),
    enrollmentChartColor: getObject<'emerald' | 'blue' | 'violet' | 'amber' | 'red'>(ENROLLMENT_CHART_COLOR_KEY, DEFAULT_DASHBOARD_PREFERENCES.enrollmentChartColor),
    enrollmentChartPeriod: Number(getObject(ENROLLMENT_CHART_PERIOD_KEY, DEFAULT_DASHBOARD_PREFERENCES.enrollmentChartPeriod)),
    revenueChartType: getObject<'bar' | 'line' | 'area'>(REVENUE_CHART_TYPE_KEY, DEFAULT_DASHBOARD_PREFERENCES.revenueChartType),
    revenueChartColor: getObject<string>(REVENUE_CHART_COLOR_KEY, DEFAULT_DASHBOARD_PREFERENCES.revenueChartColor),
    attendanceChartType: getObject<'bar' | 'line' | 'area'>(ATTENDANCE_CHART_TYPE_KEY, DEFAULT_DASHBOARD_PREFERENCES.attendanceChartType),
    attendanceChartColor: getObject<string>(ATTENDANCE_CHART_COLOR_KEY, DEFAULT_DASHBOARD_PREFERENCES.attendanceChartColor),
    hasanatChartType: getObject<'pie' | 'bar' | 'radar'>(HASANAT_CHART_TYPE_KEY, DEFAULT_DASHBOARD_PREFERENCES.hasanatChartType),
    hasanatChartColor: getObject<string>(HASANAT_CHART_COLOR_KEY, DEFAULT_DASHBOARD_PREFERENCES.hasanatChartColor),
  };
}

export function useDashboardConfig() {
  const prefs = useLiveObject<DashboardPreferences>(
    DASHBOARD_PREFERENCES_KEY,
    DEFAULT_DASHBOARD_PREFERENCES,
    { loadFn: loadDashboardPreferences }
  );

  const customWidgets = useLiveObject<CustomWidget[]>(
    DASHBOARD_WIDGETS_KEY,
    [],
    { loadFn: () => getOrInitializeCustomWidgets() },
  );

  useEffect(() => {
    const unified = getObject<DashboardPreferences | null>(DASHBOARD_PREFERENCES_KEY, null);
    if (!unified) {
      const legacy = loadDashboardPreferences();
      saveObject(DASHBOARD_PREFERENCES_KEY, legacy);
    }

    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const current = getOrInitializeCustomWidgets();
    if (!saved || JSON.stringify(saved) !== JSON.stringify(current)) {
      saveObject(DASHBOARD_WIDGETS_KEY, current);
    }
  }, []);

  const updateCustomWidgets = useCallback((customWidgetsDraft: CustomWidget[]) => {
    saveObject(DASHBOARD_WIDGETS_KEY, customWidgetsDraft);
  }, []);

  const updatePref = useCallback(<K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => {
    const current = loadDashboardPreferences();
    saveObject(DASHBOARD_PREFERENCES_KEY, { ...current, [key]: value });
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    const disabledCardIds = prefs.disabledCardIds;
    const updated = disabledCardIds.includes(cardId)
      ? disabledCardIds.filter((id) => id !== cardId)
      : [...disabledCardIds, cardId];
    updatePref('disabledCardIds', updated);
  }, [prefs.disabledCardIds, updatePref]);

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
    updatePref,
  };
}
