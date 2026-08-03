import type { QueryClient } from '@tanstack/react-query';
import {
  CONTACTS_DUPLICATES_QUERY_KEY,
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_REPORT_ANALYTICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  contactsListQueryKey,
} from '@/tenant/features/contacts/hooks/contactsQueryKeys';
import {
  MESSAGING_CONTACTS_RESOLVE_QUERY_KEY,
  MESSAGING_RECIPIENTS_QUERY_KEY,
} from '@/tenant/hooks/collections/messaging';

/** Invalidate Contacts + messaging hydrate Query keys (mutations + live push). */
export function invalidateContactsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: contactsListQueryKey(false) });
  void queryClient.invalidateQueries({ queryKey: contactsListQueryKey(true) });
  void queryClient.invalidateQueries({ queryKey: CONTACTS_METRICS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CONTACTS_REPORT_ANALYTICS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CONTACTS_DUPLICATES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: MESSAGING_CONTACTS_RESOLVE_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: MESSAGING_RECIPIENTS_QUERY_KEY });
}
