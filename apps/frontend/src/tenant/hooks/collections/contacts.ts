/**
 * Cross-module public surface for Contacts Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/contacts/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  CONTACTS_QUERY_KEY,
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  useContactById,
  useContactsByIds,
  useContactMutations,
  useContactsMetrics,
  useContactsReportAnalytics,
  useContactsWidgetAggregates,
  useContactsSavedReportsSource,
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
} from '@/tenant/features/contacts/hooks/useContacts';
export {
  CONTACTS_LOOKUPS_QUERY_KEY,
  useContactLookupsQuery,
  useContactLookupMutation,
} from '@/tenant/features/contacts/hooks/useContactLookups';
export {
  CONTACTS_FIELD_CONFIG_QUERY_KEY,
  CONTACTS_PREFERENCES_QUERY_KEY,
  useContactFieldConfigQuery,
  useContactFieldConfigMutation,
  useContactPreferencesQuery,
  useContactPreferencesMutation,
} from '@/tenant/features/contacts/hooks/useContactSetupConfig';
export { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useContactsContractList,
  useContactsContractGet,
  useContactsContractReportAnalytics,
  useContactsContractCreate,
  useContactsContractUpdate,
  useContactsContractDelete,
} from '@/tenant/features/contacts/hooks/useContactsTsrHooks';
