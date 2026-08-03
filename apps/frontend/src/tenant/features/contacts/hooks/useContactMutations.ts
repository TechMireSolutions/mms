import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CONTACTS_MODULE_MANIFEST, type Contact } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { enqueueContactsOutbox } from '@/lib/contacts/contactsSyncOutbox';
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

const CONTACTS_API = CONTACTS_MODULE_MANIFEST.restBasePath;

export function useInvalidateContactsQueries() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: contactsListQueryKey(false) });
    void queryClient.invalidateQueries({ queryKey: contactsListQueryKey(true) });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_REPORT_ANALYTICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_DUPLICATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_CONTACTS_RESOLVE_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_RECIPIENTS_QUERY_KEY });
  };
}

export function useContactMutations() {
  const invalidate = useInvalidateContactsQueries();

  const upsertContact = useMutation({
    mutationFn: async (contact: Contact) =>
      apiJson<{ contact: Contact }>(CONTACTS_API, {
        method: 'POST',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
    onError: (_err, contact) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'upsert', contact });
      }
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, contact }: { id: string; contact: Contact }) =>
      apiJson<{ contact: Contact }>(`${CONTACTS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
    onError: (_err, { id, contact }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'update', contactId: id, contact });
      }
    },
  });

  const deleteContact = useMutation({
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiFetch(`${CONTACTS_API}/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
    onError: (_err, { id, deletionReason }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'delete', contactId: id, deletionReason });
      }
    },
  });

  const bulkDeleteContacts = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: (string | number)[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${CONTACTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids, ...(deletionReason ? { deletionReason } : {}) }),
      }),
    onSuccess: invalidate,
  });

  const restoreContact = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean; contact: Contact }>(
        `${CONTACTS_API}/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: invalidate,
  });

  const bulkRestoreContacts = useMutation({
    mutationFn: async (ids: (string | number)[]) =>
      apiJson<{
        success: boolean;
        succeeded: number;
        failed: number;
        conflicts?: Array<{ id: string; errors: Array<{ message: string }> }>;
      }>(`${CONTACTS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const mergeContacts = useMutation({
    mutationFn: async (payload: {
      keepId: string | number;
      deleteId: string | number;
      merged?: Contact;
    }) =>
      apiJson<{ success: boolean; contact: Contact }>(`${CONTACTS_API}/merge`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  });

  const logExportAudit = useMutation({
    mutationFn: async (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  const logSetupAudit = useMutation({
    mutationFn: async (payload: { area: 'fields' | 'preferences' | 'sync'; summary: string }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/setup-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    upsertContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts,
    bulkRestoreContacts,
    restoreContact,
    mergeContacts,
    logExportAudit,
    logSetupAudit,
  };
}
