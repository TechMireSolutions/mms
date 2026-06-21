import { useCallback } from 'react';
import type { Contact } from '@mms/shared';
import { notify } from '@/lib/notify';
import { reportClientError } from '@/lib/clientErrorReporting';
import useTranslation from '@/hooks/useTranslation';
import { useContactMutations } from '@/hooks/useContacts';

export function useContactsPageActions() {
  const { t } = useTranslation();
  const { upsertContact, updateContact, deleteContact, bulkDeleteContacts: bulkDeleteMutation, bulkRestoreContacts: bulkRestoreMutation, restoreContact: restoreMutation, logExportAudit, logMergeAudit } = useContactMutations();

  const saveFailed = useCallback(() => {
    notify.error(t('contacts.saveFailed'));
  }, [t]);

  const saveContact = useCallback(
    async (contact: Contact, isNew: boolean): Promise<void> => {
      try {
        if (isNew) {
          await upsertContact.mutateAsync(contact);
        } else {
          await updateContact.mutateAsync({ id: String(contact.id), contact });
        }
      } catch {
        saveFailed();
        throw new Error('contact_save_failed');
      }
    },
    [upsertContact, updateContact, saveFailed],
  );

  const removeContact = useCallback(
    async (id: string | number, name?: string, deletionReason?: string): Promise<void> => {
      try {
        await deleteContact.mutateAsync({
          id: String(id),
          ...(deletionReason ? { deletionReason } : {}),
        });
        notify.info(t('contacts.deletedTitle'), {
          description: name
            ? t('contacts.deletedDescription', { name })
            : t('contacts.deletedDescriptionDefault'),
        });
      } catch {
        saveFailed();
      }
    },
    [deleteContact, t, saveFailed],
  );

  const mergeContacts = useCallback(
    async (keepId: string | number, deleteId: string | number, merged: Contact): Promise<void> => {
      try {
        await updateContact.mutateAsync({ id: String(keepId), contact: merged });
        await deleteContact.mutateAsync({ id: String(deleteId) });
        void logMergeAudit
          .mutateAsync({
            keepId,
            deleteId,
            mergedName: merged.name || merged.firstName,
          })
          .catch((err) => {
            reportClientError(err, { scope: 'contacts.merge_audit' });
          });
        notify.success(t('contacts.mergeSuccessTitle'), {
          description: t('contacts.mergeSuccessDesc'),
        });
      } catch {
        saveFailed();
      }
    },
    [updateContact, deleteContact, logMergeAudit, t, saveFailed],
  );

  const importContacts = useCallback(
    async (list: Contact[]): Promise<void> => {
      let succeeded = 0;
      let failed = 0;
      for (const contact of list) {
        try {
          await upsertContact.mutateAsync(contact);
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      if (succeeded > 0 && failed === 0) {
        notify.success(
          list.length === 1
            ? t('contacts.importSuccessOne')
            : t('contacts.importSuccess', { count: succeeded }),
        );
      } else if (succeeded > 0 && failed > 0) {
        notify.warning(t('contacts.bulkPartialFailure', { succeeded, failed }));
      } else {
        saveFailed();
      }
    },
    [upsertContact, t, saveFailed],
  );

  const bulkDeleteContacts = useCallback(
    async (ids: (string | number)[], deletionReason?: string): Promise<void> => {
      if (ids.length === 0) return;
      try {
        const result = await bulkDeleteMutation.mutateAsync({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        });
        if (result.succeeded > 0 && result.failed === 0) {
          notify.success(
            result.succeeded === 1
              ? t('contacts.deletedTitle')
              : t('contacts.bulkDeleteSuccess', { count: result.succeeded }),
          );
        } else if (result.succeeded > 0 && result.failed > 0) {
          notify.warning(t('contacts.bulkPartialFailure', { succeeded: result.succeeded, failed: result.failed }));
        } else {
          saveFailed();
        }
      } catch {
        saveFailed();
      }
    },
    [bulkDeleteMutation, t, saveFailed],
  );

  const restoreContact = useCallback(
    async (id: string): Promise<void> => {
      await restoreMutation.mutateAsync(id);
    },
    [restoreMutation],
  );

  const bulkRestoreContacts = useCallback(
    async (ids: (string | number)[]): Promise<{ succeeded: number; failed: number }> => {
      return bulkRestoreMutation.mutateAsync(ids);
    },
    [bulkRestoreMutation],
  );

  return {
    saveContact,
    removeContact,
    mergeContacts,
    importContacts,
    updateContact,
    bulkDeleteContacts,
    bulkRestoreContacts,
    restoreContact,
    logExportAudit,
    logMergeAudit,
  };
}
