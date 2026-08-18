/**
 * Cross-module public surface for Dashboard Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/dashboard/hooks/*`.
 */
export {
  DASHBOARD_PREFERENCES_QUERY_KEY,
  DASHBOARD_WIDGETS_QUERY_KEY,
  invalidateDashboardQueries,
  useDashboardPreferencesQuery,
  useDashboardPreferencesMutation,
  useDashboardWidgetsQuery,
  useDashboardWidgetsMutation,
  useDashboardWidgetDeleteMutation,
} from '@/tenant/features/dashboard/hooks/useDashboardSetupConfig';
export {
  fetchDashboardPreferences,
  saveDashboardPreferencesAsync,
  fetchDashboardWidgets,
  saveDashboardWidgetsAsync,
  deleteDashboardWidgetAsync,
} from '@/tenant/features/dashboard/hooks/dashboardApi';
