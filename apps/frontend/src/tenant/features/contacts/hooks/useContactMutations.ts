import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CONTACTS_MODULE_MANIFEST,
  type Contact,
  type ContactIdentityMatchBody,
  type ContactIdentityMatchResult,
} from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { enqueueContactsOutbox } from '@/lib/contacts/contactsSyncOutbox';
import { createModuleCrudMutations } from '@/lib/query/createModuleCrudMutations';
import { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';

const CONTACTS_API = CONTACTS_MODULE_MANIFEST.restBasePath;

export function useInvalidateContactsQueries() {
  const queryClient = useQueryClient();
  return () => invalidateContactsQueries(queryClient);
}

const useSharedCrudMutations = createModuleCrudMutations<Contact>({
  apiBase: CONTACTS_API,
  normalizeStored: (contact) => contact,
  invalidate: (queryClient) => invalidateContactsQueries(queryClient),
  updateRecordKey: 'contact',
});

/**
 * Server mutations for Contact records. Bulk-delete/restore/audit reuse the shared
 * module CRUD factory; create/update/delete/merge stay local because they need the
 * `{ contact }` response shape and the offline-outbox `onError` hook the factory
 * does not expose.
 */
export function useContactMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => invalidateContactsQueries(queryClient);

  const { bulkDelete, restore, logExportAudit, logSetupAudit } = useSharedCrudMutations();

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

  const matchContactIdentity = useMutation({
    mutationFn: async (body: ContactIdentityMatchBody) =>
      apiJson<ContactIdentityMatchResult>(`${CONTACTS_API}/identity-match`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });

  return {
    upsertContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts: bulkDelete,
    restoreContact: restore,
    bulkRestoreContacts,
    mergeContacts,
    matchContactIdentity,
    logExportAudit,
    logSetupAudit,
  };
}
