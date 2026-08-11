export {
  CONTACTS_QUERY_KEY,
  CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
  CONTACTS_SAVED_REPORTS_QUERY_KEY,
  CONTACTS_GOOGLE_SYNC_QUERY_KEY,
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_REPORT_ANALYTICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  CONTACTS_DUPLICATES_QUERY_KEY,
  contactDetailQueryKey,
} from '@/tenant/features/contacts/hooks/contactsQueryKeys';

export {
  contactsPaginatedQueryKey,
  fetchContactsPageForQuery,
  fetchContactById,
  useContactsPaginated,
  useContactById,
  useContactsByIds,
  type ContactsPaginatedParams,
} from '@/tenant/features/contacts/hooks/useContactsListQueries';

export {
  useContactsMetrics,
  useContactsReportAnalytics,
  useContactsWidgetAggregates,
  useContactsDuplicatePairs,
  type ContactsReportAnalyticsParams,
  type ContactsReportAnalyticsResult,
  type ContactsWidgetAggregateWidgetInput,
  type ContactsDuplicatesParams,
} from '@/tenant/features/contacts/hooks/useContactsAnalyticsQueries';

export {
  useContactGoogleSyncConfig,
  useContactGoogleSyncMutations,
} from '@/tenant/features/contacts/hooks/useContactGoogleSyncQueries';

export {
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
  useContactsSavedReports,
  useContactsSavedReportMutations,
  useContactsSavedReportsSource,
  type ContactsSavedReportCreateInput,
} from '@/tenant/features/contacts/hooks/useContactPrefsQueries';
