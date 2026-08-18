import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  normalizeDashboardPreferences,
  type DashboardPreferencesPutBody,
  type DashboardWidgetDto,
  type DashboardWidgetsPutBody,
} from '@mms/shared';
import { getOrInitializeCustomWidgets } from '@/lib/reports/widgetDefaults';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  fetchDashboardPreferences,
  saveDashboardPreferencesAsync,
  fetchDashboardWidgets,
  saveDashboardWidgetsAsync,
  deleteDashboardWidgetAsync,
} from './dashboardApi';

export const DASHBOARD_PREFERENCES_QUERY_KEY = ['dashboard', 'preferences'] as const;
export const DASHBOARD_WIDGETS_QUERY_KEY = ['dashboard', 'widgets'] as const;

export function useDashboardPreferencesQuery() {
  return useQuery({
    queryKey: DASHBOARD_PREFERENCES_QUERY_KEY,
    queryFn: fetchDashboardPreferences,
    select: (data) => normalizeDashboardPreferences(data),
    placeholderData: DEFAULT_DASHBOARD_PREFERENCES,
  });
}

export function useDashboardPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: DashboardPreferencesPutBody) => saveDashboardPreferencesAsync(prefs),
    onSuccess: (saved) => {
      queryClient.setQueryData(DASHBOARD_PREFERENCES_QUERY_KEY, saved);
      queryClient.invalidateQueries({ queryKey: DASHBOARD_PREFERENCES_QUERY_KEY });
    },
  });
}

export function useDashboardWidgetsQuery() {
  return useQuery({
    queryKey: DASHBOARD_WIDGETS_QUERY_KEY,
    queryFn: fetchDashboardWidgets,
    select: (widgets): CustomWidget[] => {
      if (Array.isArray(widgets) && widgets.length > 0) {
        return widgets as CustomWidget[];
      }
      return getOrInitializeCustomWidgets();
    },
    placeholderData: getOrInitializeCustomWidgets() as DashboardWidgetDto[],
  });
}

export function useDashboardWidgetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgets: DashboardWidgetsPutBody) => saveDashboardWidgetsAsync(widgets),
    onSuccess: (saved) => {
      queryClient.setQueryData(DASHBOARD_WIDGETS_QUERY_KEY, saved);
      queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_QUERY_KEY });
    },
  });
}

export function useDashboardWidgetDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDashboardWidgetAsync(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<DashboardWidgetDto[]>(DASHBOARD_WIDGETS_QUERY_KEY, (old) =>
        old ? old.filter((w) => w.id !== id) : [],
      );
      queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_QUERY_KEY });
    },
  });
}
