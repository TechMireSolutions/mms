import { useQueryClient } from '@tanstack/react-query';
import {
  type Contact,
  type ContactIdentityMatchBody,
} from '@mms/shared';
import { tsrClient } from '@/lib/api';
import { enqueueContactsOutbox } from '@/lib/contacts/contactsSyncOutbox';
import {
  useContactsContractRestore,
  useContactsContractBulkDelete,
  useContactsContractBulkRestore,
  useContactsContractLogExportAudit,
  useContactsContractLogSetupAudit,
} from '@/tenant/features/contacts/hooks/useContactsTsrHooks';
import { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';

export function useInvalidateContactsQueries() {
  const queryClient = useQueryClient();
  return () => invalidateContactsQueries(queryClient);
}

/**
 * Server mutations for Contact records. Bulk-delete/restore/audit use ts-rest contracts;
 * create/update/delete/merge use tsrClient.contacts.
 */
export function useContactMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => invalidateContactsQueries(queryClient);

  const bulkDeleteMutation = useContactsContractBulkDelete();
  const restoreMutation = useContactsContractRestore();
  const bulkRestoreMutation = useContactsContractBulkRestore();
  const logExportAuditMutation = useContactsContractLogExportAudit();
  const logSetupAuditMutation = useContactsContractLogSetupAudit();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const upsertContactMutation = tsrClient.contacts.create.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const updateContactMutation = tsrClient.contacts.update.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteContactMutation = tsrClient.contacts.delete.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const mergeContactsMutation = tsrClient.contacts.merge.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const matchContactIdentity = tsrClient.contacts.identityMatch.useMutation();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkTagContactsMutation = tsrClient.contacts.bulkTag.useMutation({
    onSuccess: invalidate,
  });

  return {
    upsertContact: {
      ...upsertContactMutation,
      mutateAsync: async (contact: Contact) => {
        try {
          return await upsertContactMutation.mutateAsync({ body: contact });
        } catch (error) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueContactsOutbox({ kind: 'upsert', contact });
          }
          throw error;
        }
      }
    },
    updateContact: {
      ...updateContactMutation,
      mutateAsync: async ({ id, contact }: { id: string; contact: Contact }) => {
        try {
          return await updateContactMutation.mutateAsync({ params: { id }, body: contact });
        } catch (error) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueContactsOutbox({ kind: 'update', contactId: id, contact });
          }
          throw error;
        }
      }
    },
    deleteContact: {
      ...deleteContactMutation,
      mutateAsync: async ({ id, deletionReason }: { id: string; deletionReason?: string }) => {
        try {
          return await deleteContactMutation.mutateAsync({
            params: { id },
            body: deletionReason ? { deletionReason } : {}
          });
        } catch (error) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueContactsOutbox({ kind: 'delete', contactId: id, deletionReason });
          }
          throw error;
        }
      }
    },
    bulkDeleteContacts: {
      mutateAsync: (payload: { ids: string[]; deletionReason?: string }) => bulkDeleteMutation.mutateAsync({ body: payload }),
      isPending: bulkDeleteMutation.isPending,
    },
    restoreContact: {
      mutateAsync: (id: string) => restoreMutation.mutateAsync({ params: { id } }),
      isPending: restoreMutation.isPending,
    },
    bulkRestoreContacts: {
      mutateAsync: (ids: string[]) => bulkRestoreMutation.mutateAsync({ body: { ids } }),
      isPending: bulkRestoreMutation.isPending,
    },
    mergeContacts: {
      ...mergeContactsMutation,
      mutateAsync: async (payload: { keepId: string | number; deleteId: string | number; merged?: Contact }) => {
        return mergeContactsMutation.mutateAsync({ body: payload });
      }
    },
    matchContactIdentity: {
      ...matchContactIdentity,
      mutateAsync: async (body: ContactIdentityMatchBody) => {
        return matchContactIdentity.mutateAsync({ body });
      }
    },
    bulkTagContacts: {
      ...bulkTagContactsMutation,
      mutateAsync: async (payload: { ids: string[]; addTags?: string[]; removeTags?: string[] }) => {
        return bulkTagContactsMutation.mutateAsync({ body: payload });
      }
    },
    logExportAudit: {
      mutateAsync: (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }) =>
        logExportAuditMutation.mutateAsync({ body: payload }),
      isPending: logExportAuditMutation.isPending,
    },
    logSetupAudit: {
      mutateAsync: (payload: { area: 'fields' | 'preferences'; summary: string }) =>
        logSetupAuditMutation.mutateAsync({ body: payload }),
      isPending: logSetupAuditMutation.isPending,
    },
  };
}
