import { useCallback } from "react";
import type { Contact, AppTranslationKey } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";

type NotifyBulkResult = (
  succeeded: number,
  failed: number,
  singleSuccessKey: AppTranslationKey,
  multiSuccessKey: AppTranslationKey,
) => void;

export function useContactsCrudWriteActions({
  t,
  handleError,
  notifyBulkResult,
}: {
  t: TranslationFunction;
  handleError: (err: unknown, scope: string, messageKey?: AppTranslationKey) => void;
  notifyBulkResult: NotifyBulkResult;
}) {
  const {
    upsertContact,
    updateContact,
    mergeContacts: mergeContactsMutation,
    bulkTagContacts: bulkTagMutation,
  } = useContactMutations();

  const saveContact = useCallback(
    async (contact: Contact, isNew: boolean): Promise<Contact> => {
      try {
        if (isNew) {
          const res = await upsertContact.mutateAsync(contact);
          return res.contact;
        } else {
          const res = await updateContact.mutateAsync({ id: String(contact.id), contact });
          return res.contact;
        }
      } catch (err) {
        handleError(err, "contacts.save_contact");
        throw err;
      }
    },
    [upsertContact, updateContact, handleError],
  );

  const mergeContacts = useCallback(
    async (keepId: string | number, deleteId: string | number, merged: Contact): Promise<void> => {
      try {
        await mergeContactsMutation.mutateAsync({
          keepId,
          deleteId,
          merged,
        });
        notify.success(t("contacts.mergeSuccessTitle"), {
          description: t("contacts.mergeSuccessDesc"),
        });
      } catch (err) {
        handleError(err, "contacts.merge_contacts");
        throw err;
      }
    },
    [mergeContactsMutation, t, handleError],
  );

  const importContacts = useCallback(
    async (list: Contact[]): Promise<void> => {
      let succeeded = 0;
      let failed = 0;
      for (const contact of list) {
        try {
          await upsertContact.mutateAsync(contact);
          succeeded += 1;
        } catch (err) {
          failed += 1;
          reportClientError(err, { scope: "contacts.import_contact_item" });
        }
      }
      notifyBulkResult(succeeded, failed, "contacts.importSuccessOne", "contacts.importSuccess");
    },
    [upsertContact, notifyBulkResult],
  );

  const bulkTagContacts = useCallback(
    async (ids: string[], addTags?: string[], removeTags?: string[]): Promise<number> => {
      try {
        const res = await bulkTagMutation.mutateAsync({ ids, addTags, removeTags });
        notify.success(t("contacts.bulkTagSuccess", { count: res.updatedCount }));
        return res.updatedCount;
      } catch (err) {
        handleError(err, "contacts.bulk_tag");
        throw err;
      }
    },
    [bulkTagMutation, t, handleError],
  );

  return {
    updateContact,
    saveContact,
    mergeContacts,
    importContacts,
    bulkTagContacts,
  };
}
