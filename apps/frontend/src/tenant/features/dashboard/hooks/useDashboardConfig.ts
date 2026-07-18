import { useCallback, useEffect } from 'react';
import { getObject, saveObject } from '@/lib/db';
import {
  DASHBOARD_DISABLED_CARDS_KEY,
  DASHBOARD_WIDGETS_KEY,
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
} from '@/lib/dashboardPreferences';
import { getOrInitializeCustomWidgets } from '@/tenant/features/reports/components/pinnedWidgets/widgetDefaults';
import type { CustomWidget } from '@/tenant/features/reports/components/PinnedWidgets';
import { useLiveObject } from '@/hooks/useLiveObject';

export function useDashboardConfig() {
  const disabledCardIds = useLiveObject<string[]>(
    DASHBOARD_DISABLED_CARDS_KEY,
    [],
  );

  const customWidgets = useLiveObject<CustomWidget[]>(
    DASHBOARD_WIDGETS_KEY,
    [],
    { loadFn: () => getOrInitializeCustomWidgets() },
  );

  const gridMode = useLiveObject<'comfortable' | 'compact'>(
    PINNED_WIDGETS_GRID_MODE_KEY,
    'comfortable',
  );

  const enrollmentChartType = useLiveObject<'area' | 'bar' | 'line'>(
    ENROLLMENT_CHART_TYPE_KEY,
    'area',
  );

  const enrollmentChartColor = useLiveObject<'emerald' | 'blue' | 'violet' | 'amber' | 'red'>(
    ENROLLMENT_CHART_COLOR_KEY,
    'emerald',
  );

  const enrollmentChartPeriod = useLiveObject<number>(
    ENROLLMENT_CHART_PERIOD_KEY,
    10,
    { loadFn: (key, fallback) => Number(getObject(key, fallback)) },
  );

  const revenueChartType = useLiveObject<'bar' | 'line' | 'area'>(
    REVENUE_CHART_TYPE_KEY,
    'bar',
  );

  const revenueChartColor = useLiveObject<string>(
    REVENUE_CHART_COLOR_KEY,
    'mixed',
  );

  const attendanceChartType = useLiveObject<'bar' | 'line' | 'area'>(
    ATTENDANCE_CHART_TYPE_KEY,
    'bar',
  );

  const attendanceChartColor = useLiveObject<string>(
    ATTENDANCE_CHART_COLOR_KEY,
    'semantic',
  );

  const hasanatChartType = useLiveObject<'pie' | 'bar' | 'radar'>(
    HASANAT_CHART_TYPE_KEY,
    'pie',
  );

  const hasanatChartColor = useLiveObject<string>(
    HASANAT_CHART_COLOR_KEY,
    'mixed',
  );

  useEffect(() => {
    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const current = getOrInitializeCustomWidgets();
    if (!saved || JSON.stringify(saved) !== JSON.stringify(current)) {
      saveObject(DASHBOARD_WIDGETS_KEY, current);
    }
  }, []);

  const updateCustomWidgets = useCallback((customWidgetsDraft: CustomWidget[]) => {
    saveObject(DASHBOARD_WIDGETS_KEY, customWidgetsDraft);
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    const updated = disabledCardIds.includes(cardId)
      ? disabledCardIds.filter((id) => id !== cardId)
      : [...disabledCardIds, cardId];
    saveObject(DASHBOARD_DISABLED_CARDS_KEY, updated);
  }, [disabledCardIds]);

  const updateGridMode = useCallback((mode: 'comfortable' | 'compact') => {
    saveObject(PINNED_WIDGETS_GRID_MODE_KEY, mode);
  }, []);

  const updateEnrollmentChartType = useCallback((type: 'area' | 'bar' | 'line') => {
    saveObject(ENROLLMENT_CHART_TYPE_KEY, type);
  }, []);

  const updateEnrollmentChartColor = useCallback((color: 'emerald' | 'blue' | 'violet' | 'amber' | 'red') => {
    saveObject(ENROLLMENT_CHART_COLOR_KEY, color);
  }, []);

  const updateEnrollmentChartPeriod = useCallback((period: number) => {
    saveObject(ENROLLMENT_CHART_PERIOD_KEY, period);
  }, []);

  const updateRevenueChartType = useCallback((type: 'bar' | 'line' | 'area') => {
    saveObject(REVENUE_CHART_TYPE_KEY, type);
  }, []);

  const updateRevenueChartColor = useCallback((color: string) => {
    saveObject(REVENUE_CHART_COLOR_KEY, color);
  }, []);

  const updateAttendanceChartType = useCallback((type: 'bar' | 'line' | 'area') => {
    saveObject(ATTENDANCE_CHART_TYPE_KEY, type);
  }, []);

  const updateAttendanceChartColor = useCallback((color: string) => {
    saveObject(ATTENDANCE_CHART_COLOR_KEY, color);
  }, []);

  const updateHasanatChartType = useCallback((type: 'pie' | 'bar' | 'radar') => {
    saveObject(HASANAT_CHART_TYPE_KEY, type);
  }, []);

  const updateHasanatChartColor = useCallback((color: string) => {
    saveObject(HASANAT_CHART_COLOR_KEY, color);
  }, []);

  return {
    disabledCardIds,
    customWidgets,
    gridMode,
    enrollmentChartType,
    enrollmentChartColor,
    enrollmentChartPeriod,
    revenueChartType,
    revenueChartColor,
    attendanceChartType,
    attendanceChartColor,
    hasanatChartType,
    hasanatChartColor,
    updateCustomWidgets,
    toggleCardVisibility,
    updateGridMode,
    updateEnrollmentChartType,
    updateEnrollmentChartColor,
    updateEnrollmentChartPeriod,
    updateRevenueChartType,
    updateRevenueChartColor,
    updateAttendanceChartType,
    updateAttendanceChartColor,
    updateHasanatChartType,
    updateHasanatChartColor,
  };
}
