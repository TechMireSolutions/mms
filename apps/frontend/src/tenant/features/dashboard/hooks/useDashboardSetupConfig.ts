import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  normalizeDashboardPreferences,
} from '@mms/shared';
import { buildDefaultCustomWidgets } from '@/lib/reports/widgetDefaults';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { tsrClient } from '@/lib/api';

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
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.dashboard.getPreferences.useQuery({
    queryKey: DASHBOARD_PREFERENCES_QUERY_KEY,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  
  const preferences = query.data?.body?.preferences 
    ? normalizeDashboardPreferences(query.data.body.preferences)
    : DEFAULT_DASHBOARD_PREFERENCES;
    
  return { ...query, data: preferences };
}

export function useDashboardPreferencesMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.dashboard.putPreferences.useMutation({
    onSuccess: (res: any) => {
      if (res.status === 200) {
        queryClient.setQueryData(DASHBOARD_PREFERENCES_QUERY_KEY, normalizeDashboardPreferences(res.body.preferences));
        invalidateDashboardQueries(queryClient);
      }
    },
    onError: () => notify.error(t('dashboard.toast.prefSaveFailed')),
  });
}

export function useDashboardWidgetsQuery() {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.dashboard.getWidgets.useQuery({
    queryKey: DASHBOARD_WIDGETS_QUERY_KEY,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const widgets = query.data?.body?.widgets
    ? (query.data.body.widgets as CustomWidget[])
    : DEFAULT_WIDGETS_PLACEHOLDER;
    
  return { ...query, data: widgets };
}

export function useDashboardWidgetsMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.dashboard.putWidgets.useMutation({
    onSuccess: (res: any) => {
      if (res.status === 200) {
        queryClient.setQueryData(DASHBOARD_WIDGETS_QUERY_KEY, res.body.widgets as CustomWidget[]);
        invalidateDashboardQueries(queryClient);
      }
    },
    onError: () => notify.error(t('dashboard.toast.saveFailed')),
  });
}

export function useDashboardWidgetDeleteMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.dashboard.deleteWidget.useMutation({
    onSuccess: (_data: any, variables: any) => {
      queryClient.setQueryData<CustomWidget[]>(DASHBOARD_WIDGETS_QUERY_KEY, (old) =>
        old ? old.filter((widget) => widget.id !== variables.params.id) : [],
      );
      invalidateDashboardQueries(queryClient);
    },
    onError: () => notify.error(t('dashboard.toast.deleteFailed')),
  });
}