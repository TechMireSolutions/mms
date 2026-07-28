import { useCallback } from "react";
import type { Contact, AppTranslationKey } from "@mms/shared";
import { getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";

export function safeAudit(promise: Promise<unknown>, scope: string): void {
  void promise.catch((auditError) => {
    reportClientError(auditError, { scope });
  });
}

export function useContactsCrudActions() {
  const { t } = useTranslation();
  const {
    upsertContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts: bulkDeleteMutation,
    bulkRestoreContacts: bulkRestoreMutation,
    restoreContact: restoreMutation,
    logExportAudit,
    logMergeAudit,
  } = useContactMutations();

  const handleError = useCallback(
    (err: unknown, scope: string, messageKey: AppTranslationKey = "contacts.saveFailed") => {
      notify.error(t(messageKey));
      reportClientError(err, { scope });
    },
    [t],
  );

  const saveFailed = useCallback(() => {
    notify.error(t("contacts.saveFailed"));
  }, [t]);

  const notifyBulkResult = useCallback(
    (
      succeeded: number,
      failed: number,
      singleSuccessKey: AppTranslationKey,
      multiSuccessKey: AppTranslationKey,
    ) => {
      if (succeeded > 0 && failed === 0) {
        notify.success(
          succeeded === 1 ? t(singleSuccessKey) : t(multiSuccessKey, { count: succeeded }),
        );
      } else if (succeeded > 0 && failed > 0) {
        notify.warning(t("contacts.bulkPartialFailure", { succeeded, failed }));
      } else {
        saveFailed();
      }
    },
    [t, saveFailed],
  );

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

  const removeContact = useCallback(
    async (id: string | number, name?: string, deletionReason?: string): Promise<void> => {
      try {
        await deleteContact.mutateAsync({
          id: String(id),
          ...(deletionReason ? { deletionReason } : {}),
        });
        notify.info(t("contacts.deletedTitle"), {
          description: name
            ? t("contacts.deletedDescription", { name })
            : t("contacts.deletedDescriptionDefault"),
        });
      } catch (err) {
        handleError(err, "contacts.remove_contact");
      }
    },
    [deleteContact, t, handleError],
  );

  const mergeContacts = useCallback(
    async (keepId: string | number, deleteId: string | number, merged: Contact): Promise<void> => {
      try {
        await updateContact.mutateAsync({ id: String(keepId), contact: merged });
        await deleteContact.mutateAsync({ id: String(deleteId) });
        safeAudit(
          logMergeAudit.mutateAsync({
            keepId,
            deleteId,
            mergedName: getDisplayName(merged),
          }),
          "contacts.merge_audit",
        );
        notify.success(t("contacts.mergeSuccessTitle"), {
          description: t("contacts.mergeSuccessDesc"),
        });
      } catch (err) {
        handleError(err, "contacts.merge_contacts");
        throw err;
      }
    },
    [updateContact, deleteContact, logMergeAudit, t, handleError],
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

  const bulkDeleteContactsAction = useCallback(
    async (ids: (string | number)[], deletionReason?: string): Promise<void> => {
      if (ids.length === 0) return;
      try {
        const result = await bulkDeleteMutation.mutateAsync({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        });
        notifyBulkResult(result.succeeded, result.failed, "contacts.deletedTitle", "contacts.bulkDeleteSuccess");
      } catch (err) {
        handleError(err, "contacts.bulk_delete");
      }
    },
    [bulkDeleteMutation, notifyBulkResult, handleError],
  );

  const restoreContactAction = useCallback(
    async (id: string): Promise<void> => {
      await restoreMutation.mutateAsync(id);
    },
    [restoreMutation],
  );

  const bulkRestoreContactsAction = useCallback(
    async (ids: (string | number)[]): Promise<{ succeeded: number; failed: number }> => {
      return bulkRestoreMutation.mutateAsync(ids);
    },
    [bulkRestoreMutation],
  );

  return {
    updateContact,
    logExportAudit,
    handleError,
    notifyBulkResult,
    saveContact,
    removeContact,
    mergeContacts,
    importContacts,
    bulkDeleteContactsAction,
    restoreContactAction,
    bulkRestoreContactsAction,
  };
}
