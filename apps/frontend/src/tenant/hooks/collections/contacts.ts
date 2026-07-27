/**
 * Cross-module public surface for Contacts Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/contacts/hooks/*`.
 */
export {
  CONTACTS_QUERY_KEY,
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_REPORT_ANALYTICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  useContacts,
  useContactsPaginated,
  useContactsCollection,
  useContactsCollectionState,
  useContactById,
  useContactsByIds,
  useContactMutations,
  useContactsMetrics,
  useContactsReportAnalytics,
  useContactsWidgetAggregates,
  useContactsDuplicatePairs,
  useContactsSavedReports,
  useContactsSavedReportMutations,
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
  contactDetailQueryKey,
  fetchContactById,
  type ContactsPaginatedParams,
  type ContactsReportAnalyticsParams,
  type ContactsReportAnalyticsResult,
  type ContactsWidgetAggregateWidgetInput,
  type UseContactsCollectionResult,
} from '@/tenant/features/contacts/hooks/useContacts';
