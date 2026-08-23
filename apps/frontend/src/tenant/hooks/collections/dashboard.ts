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
// Phase 7: contract-driven tsrClient hooks
export {
  useDashboardPreferencesQuery as useDashboardContractPreferencesQuery,
  useDashboardPreferencesMutation as useDashboardContractPreferencesMutation,
  useDashboardWidgetsQuery as useDashboardContractWidgetsQuery,
  useDashboardWidgetsMutation as useDashboardContractWidgetsMutation,
  useDashboardWidgetDeleteMutation as useDashboardContractWidgetDeleteMutation,
} from '@/tenant/features/dashboard/hooks/useDashboardSetupConfig';

