/**
 * Cross-module public surface for Contacts Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/contacts/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  CONTACTS_QUERY_KEY,
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  useContactsPaginated,
  useContactById,
  useContactsByIds,
  useContactMutations,
  useContactsMetrics,
  useContactsReportAnalytics,
  useContactsWidgetAggregates,
  useContactsSavedReportsSource,
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
  type ContactsPaginatedParams,
  type ContactsReportAnalyticsParams,
  type ContactsReportAnalyticsResult,
  type ContactsWidgetAggregateWidgetInput,
  type ContactsSavedReportCreateInput,
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
