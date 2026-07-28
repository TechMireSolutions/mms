import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@mms/shared";
import {
  getDisplayName,
  CONTACTS_MODULE_MANIFEST,
  syncContactScalarFields,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import type { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

type CrudActions = ReturnType<typeof useContactsCrudActions>;

/** Form/drawer/confirm + write handlers for Contacts Work overlays. */
export function useContactsPageActions({
  canWrite,
  canDelete,
  workContacts,
  contacts,
  selected,
  setSelected,
  shownCount,
  crud,
}: {
  canWrite: boolean;
  canDelete: boolean;
  workContacts: Contact[];
  contacts: Contact[];
  selected: Array<string | number>;
  setSelected: (ids: Array<string | number>) => void;
  shownCount: number;
  crud: Pick<
    CrudActions,
    | "updateContact"
    | "handleError"
    | "notifyBulkResult"
    | "saveContact"
    | "removeContact"
    | "mergeContacts"
    | "importContacts"
    | "bulkDeleteContactsAction"
    | "restoreContactAction"
    | "bulkRestoreContactsAction"
  >;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    updateContact,
    handleError,
    notifyBulkResult,
    saveContact,
    removeContact,
    mergeContacts,
    importContacts,
    bulkDeleteContactsAction,
    restoreContactAction,
    bulkRestoreContactsAction,
  } = crud;

  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [openingDuplicates, setOpeningDuplicates] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name?: string } | null>(null);

  const findContactById = useCallback(
    (id: string | number): Contact | undefined =>
      workContacts.find((contact) => contact.id === id) ?? contacts.find((contact) => contact.id === id),
    [workContacts, contacts],
  );

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
  }, [openingDuplicates, shownCount, queryClient, t]);

  const openForm = useCallback(
    (contact: Contact | null = null) => {
      if (!canWrite) return;
      setEditContact(contact);
      setShowForm(true);
    },
    [canWrite],
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
    [editContact, saveContact, canWrite],
  );

  const handleDelete = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      setDeleteTarget({ id, name: selectedContact ? getDisplayName(selectedContact) : undefined });
    },
    [findContactById, canDelete],
  );

  const confirmSingleDelete = useCallback(
    (deletionReason?: string) => {
      if (!deleteTarget || !canDelete) return;
      setDeleteTarget(null);
      void removeContact(deleteTarget.id, deleteTarget.name, deletionReason);
    },
    [deleteTarget, canDelete, removeContact],
  );

  const handleUpdateContact = useCallback(
    (updated: Contact): Promise<void> => {
      if (!canWrite) return Promise.resolve();
      return updateContact.mutateAsync({ id: String(updated.id), contact: updated })
        .then(() => undefined)
        .catch((err: unknown) => {
          handleError(err, "contacts.update_contact");
          throw err;
        });
    },
    [canWrite, updateContact, handleError],
  );

  const checkBulkAllowed = useCallback(
    () => canDelete && selected.length > 0,
    [canDelete, selected.length],
  );

  const requestBulkDelete = useCallback(() => {
    if (checkBulkAllowed()) setBulkDeleteOpen(true);
  }, [checkBulkAllowed]);

  const confirmBulkDelete = useCallback(
    (deletionReason?: string) => {
      if (!checkBulkAllowed()) return;
      setBulkDeleteOpen(false);
      void bulkDeleteContactsAction(selected, deletionReason).then(() => setSelected([]));
    },
    [checkBulkAllowed, selected, bulkDeleteContactsAction, setSelected],
  );

  const requestBulkRestore = useCallback(() => {
    if (checkBulkAllowed()) setBulkRestoreOpen(true);
  }, [checkBulkAllowed]);

  const confirmBulkRestore = useCallback(() => {
    if (!checkBulkAllowed()) return;
    setBulkRestoreOpen(false);
    void bulkRestoreContactsAction(selected)
      .then((result) => {
        notifyBulkResult(
          result.succeeded,
          result.failed,
          "contacts.restoreSuccessTitle",
          "contacts.bulkRestoreSuccess",
        );
        setSelected([]);
      })
      .catch((err) => {
        handleError(err, "contacts.bulk_restore", "contacts.restoreFailed");
      });
  }, [
    checkBulkAllowed,
    selected,
    bulkRestoreContactsAction,
    notifyBulkResult,
    handleError,
    setSelected,
  ]);

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

  const handleRestore = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      const name = selectedContact ? getDisplayName(selectedContact) : undefined;
      void restoreContactAction(String(id))
        .then(() => {
          notify.success(t("contacts.restoreSuccessTitle"), {
            description: name
              ? t("contacts.restoreSuccessDescription", { name })
              : t("contacts.restoreSuccessDescriptionDefault"),
          });
        })
        .catch((err) => {
          handleError(err, "contacts.restore_single", "contacts.restoreFailed");
        });
    },
    [canDelete, findContactById, restoreContactAction, t, handleError],
  );

  return {
    showForm,
    setShowForm,
    editContact,
    setEditContact,
    viewContact,
    setViewContact,
    showDuplicates,
    setShowDuplicates,
    openingDuplicates,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkRestoreOpen,
    setBulkRestoreOpen,
    deleteTarget,
    setDeleteTarget,
    handleOpenDuplicates,
    handleEdit,
    handleCreateContact,
    handleSave,
    handleDelete,
    confirmSingleDelete,
    handleUpdateContact,
    requestBulkDelete,
    confirmBulkDelete,
    requestBulkRestore,
    confirmBulkRestore,
    handleImport,
    handleMerge,
    handleRestore,
  };
}
