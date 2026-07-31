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
  const { upsertContact, updateContact, mergeContacts: mergeContactsMutation } = useContactMutations();

  const saveContact = useCallback(
    async (contact: Contact, isNew: boolean): Promise<void> => {
      try {
        if (isNew) {
          await upsertContact.mutateAsync(contact);
        } else {
          await updateContact.mutateAsync({ id: String(contact.id), contact });
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

  return {
    updateContact,
    saveContact,
    mergeContacts,
    importContacts,
  };
}
