import { useCallback } from 'react';
import type { Contact } from '@mms/shared';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useContactMutations } from '@/hooks/useContacts';

export function useContactsPageActions() {
  const { t } = useTranslation();
  const { upsertContact, updateContact, deleteContact } = useContactMutations();

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
    async (id: string | number, name?: string): Promise<void> => {
      try {
        await deleteContact.mutateAsync(String(id));
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
        await deleteContact.mutateAsync(String(deleteId));
        notify.success(t('contacts.mergeSuccessTitle'), {
          description: t('contacts.mergeSuccessDesc'),
        });
      } catch {
        saveFailed();
      }
    },
    [updateContact, deleteContact, t, saveFailed],
  );

  const importContacts = useCallback(
    async (list: Contact[]): Promise<void> => {
      try {
        for (const contact of list) {
          await upsertContact.mutateAsync(contact);
        }
        notify.success(
          list.length === 1
            ? t('contacts.importSuccessOne')
            : t('contacts.importSuccess', { count: list.length }),
        );
      } catch {
        saveFailed();
      }
    },
    [upsertContact, t, saveFailed],
  );

  const isMutating =
    upsertContact.isPending || updateContact.isPending || deleteContact.isPending;

  return {
    saveContact,
    removeContact,
    mergeContacts,
    importContacts,
    updateContact,
    isMutating,
  };
}
