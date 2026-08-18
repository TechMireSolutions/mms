import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  normalizeDashboardPreferences,
  type DashboardPreferencesPutBody,
  type DashboardWidgetsPutBody,
} from '@mms/shared';
import { buildDefaultCustomWidgets } from '@/lib/reports/widgetDefaults';
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

/** Pure seeded default widgets, computed once — placeholder while the server query loads. */
const DEFAULT_WIDGETS_PLACEHOLDER: CustomWidget[] = buildDefaultCustomWidgets();

export function invalidateDashboardQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: DASHBOARD_PREFERENCES_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_QUERY_KEY });
}

export function useDashboardPreferencesQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: DASHBOARD_PREFERENCES_QUERY_KEY,
    queryFn: ({ signal }) => fetchDashboardPreferences(signal),
    enabled: isAuthenticated,
    select: (data) => normalizeDashboardPreferences(data),
    placeholderData: DEFAULT_DASHBOARD_PREFERENCES,
    staleTime: 60_000,
  });
}

export function useDashboardPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: DashboardPreferencesPutBody) => saveDashboardPreferencesAsync(prefs),
    onSuccess: (saved) => {
      queryClient.setQueryData(DASHBOARD_PREFERENCES_QUERY_KEY, normalizeDashboardPreferences(saved));
      queryClient.invalidateQueries({ queryKey: DASHBOARD_PREFERENCES_QUERY_KEY });
    },
  });
}

export function useDashboardWidgetsQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: DASHBOARD_WIDGETS_QUERY_KEY,
    queryFn: ({ signal }) => fetchDashboardWidgets(signal),
    enabled: isAuthenticated,
    select: (widgets): CustomWidget[] => widgets as CustomWidget[],
    placeholderData: () => DEFAULT_WIDGETS_PLACEHOLDER,
    staleTime: 60_000,
  });
}

export function useDashboardWidgetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgets: CustomWidget[]) =>
      saveDashboardWidgetsAsync(widgets as DashboardWidgetsPutBody),
    onSuccess: (saved) => {
      queryClient.setQueryData(DASHBOARD_WIDGETS_QUERY_KEY, saved as CustomWidget[]);
      queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_QUERY_KEY });
    },
  });
}

export function useDashboardWidgetDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDashboardWidgetAsync(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<CustomWidget[]>(DASHBOARD_WIDGETS_QUERY_KEY, (old) =>
        old ? old.filter((widget) => widget.id !== id) : [],
      );
      queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_QUERY_KEY });
    },
  });
}