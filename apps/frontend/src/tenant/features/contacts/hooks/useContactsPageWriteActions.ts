import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CONTACTS_MODULE_MANIFEST,
  mergeContactEditSavePayload,
  type Contact,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsBackgroundJobs";
import { CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import type { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

type CrudActions = ReturnType<typeof useContactsCrudActions>;

export function useContactsPageWriteActions({
  canWrite,
  shownCount,
  selected,
  editContact,
  setEditContact,
  setShowForm,
  setShowDuplicates,
  openingDuplicates,
  setOpeningDuplicates,
  crud,
}: {
  canWrite: boolean;
  shownCount: number;
  selected?: Array<string | number>;
  editContact: Contact | null;
  setEditContact: (contact: Contact | null) => void;
  setShowForm: (open: boolean) => void;
  setShowDuplicates: (open: boolean) => void;
  openingDuplicates: boolean;
  setOpeningDuplicates: (open: boolean) => void;
  crud: Pick<
    CrudActions,
    | "updateContact"
    | "handleError"
    | "saveContact"
    | "mergeContacts"
    | "importContacts"
    | "bulkTagContacts"
  >;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    updateContact,
    handleError,
    saveContact,
    mergeContacts,
    importContacts,
    bulkTagContacts,
  } = crud;

  const handleOpenDuplicates = useCallback(async () => {
    if (openingDuplicates) return;
    const needsAsyncScan = shownCount >= CONTACTS_MODULE_MANIFEST.duplicateScanAsyncMinContacts;
    if (needsAsyncScan) {
      setOpeningDuplicates(true);
      try {
        const job = await startContactsDuplicateScan(t("contacts.jobs.duplicateScanLabel"));
        await queryClient.invalidateQueries({ queryKey: CONTACTS_DUPLICATES_QUERY_KEY });
        const pairCount = job.progress?.current ?? 0;
        notify.success(t("contacts.duplicates.scanComplete", { count: pairCount }));
      } catch {
        notify.error(t("contacts.duplicates.scanFailed"));
        return;
      } finally {
        setOpeningDuplicates(false);
      }
    }
    setShowDuplicates(true);
  }, [openingDuplicates, shownCount, queryClient, t, setOpeningDuplicates, setShowDuplicates]);

  const openForm = useCallback(
    (contact: Contact | null = null) => {
      if (!canWrite) return;
      setEditContact(contact);
      setShowForm(true);
    },
    [canWrite, setEditContact, setShowForm],
  );

  const handleEdit = openForm;
  const handleCreateContact = useCallback(() => openForm(null), [openForm]);

  const handleSave = useCallback(
    async (contactDraft: Contact): Promise<void> => {
      if (!canWrite) {
        throw new Error(t("contacts.form.writeDenied"));
      }
      const isCreatingContact = !editContact;
      const payload = mergeContactEditSavePayload(editContact, contactDraft);

      await saveContact(payload, isCreatingContact);
      setShowForm(false);
      setEditContact(null);
    },
    [editContact, saveContact, canWrite, setShowForm, setEditContact, t],
  );

  const handleUpdateContact = useCallback(
    (updated: Contact): Promise<void> => {
      if (!canWrite) {
        return Promise.reject(new Error(t("contacts.form.writeDenied")));
      }
      return updateContact
        .mutateAsync({ id: String(updated.id), contact: updated })
        .then(() => undefined)
        .catch((err: unknown) => {
          handleError(err, "contacts.update_contact");
          throw err;
        });
    },
    [canWrite, updateContact, handleError, t],
  );

  const handleImport = useCallback(
    async (list: Contact[]): Promise<void> => {
      if (!canWrite) {
        throw new Error(t("contacts.form.writeDenied"));
      }
      await importContacts(list);
    },
    [canWrite, importContacts, t],
  );

  const handleMerge = useCallback(
    async (keepId: string | number, deleteId: string | number, mergedData: Contact) => {
      if (!canWrite) {
        throw new Error(t("contacts.form.writeDenied"));
      }
      await mergeContacts(keepId, deleteId, mergedData);
    },
    [canWrite, mergeContacts, t],
  );

  const handleBulkTag = useCallback(
    async (tags: string[]) => {
      if (!canWrite) {
        throw new Error(t("contacts.form.writeDenied"));
      }
      const ids = (selected ?? []).map(String);
      if (ids.length === 0 || tags.length === 0) return;
      await bulkTagContacts(ids, tags);
    },
    [canWrite, selected, bulkTagContacts, t],
  );

  return {
    handleOpenDuplicates,
    handleEdit,
    handleCreateContact,
    handleSave,
    handleUpdateContact,
    handleImport,
    handleMerge,
    handleBulkTag,
  };
}
