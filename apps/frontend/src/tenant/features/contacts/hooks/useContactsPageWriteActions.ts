import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CONTACTS_MODULE_MANIFEST,
  syncContactScalarFields,
  type Contact,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import type { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

type CrudActions = ReturnType<typeof useContactsCrudActions>;

export function useContactsPageWriteActions({
  canWrite,
  shownCount,
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
      if (!canWrite) return;
      const isCreatingContact = !editContact;
      const basePayload = syncContactScalarFields(contactDraft);

      const payload: Contact = {
        ...(editContact || {}),
        ...contactDraft,
        ...basePayload,
        phones: contactDraft.phones ?? [],
        emails: contactDraft.emails ?? [],
        addresses: contactDraft.addresses ?? [],
        socials: contactDraft.socials ?? [],
        emergencyContacts: contactDraft.emergencyContacts ?? [],
      };

      await saveContact(payload, isCreatingContact);
      setShowForm(false);
      setEditContact(null);
    },
    [editContact, saveContact, canWrite, setShowForm, setEditContact],
  );

  const handleUpdateContact = useCallback(
    (updated: Contact): Promise<void> => {
      if (!canWrite) return Promise.resolve();
      return updateContact
        .mutateAsync({ id: String(updated.id), contact: updated })
        .then(() => undefined)
        .catch((err: unknown) => {
          handleError(err, "contacts.update_contact");
          throw err;
        });
    },
    [canWrite, updateContact, handleError],
  );

  const handleImport = useCallback(
    async (list: Contact[]): Promise<void> => {
      if (!canWrite) return;
      await importContacts(list);
    },
    [canWrite, importContacts],
  );

  const handleMerge = useCallback(
    async (keepId: string | number, deleteId: string | number, mergedData: Contact) => {
      if (!canWrite) return;
      await mergeContacts(keepId, deleteId, mergedData);
    },
    [canWrite, mergeContacts],
  );

  return {
    handleOpenDuplicates,
    handleEdit,
    handleCreateContact,
    handleSave,
    handleUpdateContact,
    handleImport,
    handleMerge,
  };
}
