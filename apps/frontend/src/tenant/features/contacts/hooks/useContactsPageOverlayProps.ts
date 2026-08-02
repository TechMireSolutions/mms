import { useMemo } from "react";
import type { Contact } from "@mms/shared";
import type { ContactsPageOverlaysProps } from "@/tenant/features/contacts/components/ContactsPageOverlays";

export function useContactsPageOverlayProps({
  canWrite,
  canDelete,
  showForm,
  editContact,
  defaultCountry,
  defaultCity,
  defaultProvince,
  setShowForm,
  setEditContact,
  handleSave,
  showDuplicates,
  setShowDuplicates,
  handleMerge,
  messagingTarget,
  closeComposer,
  viewContact,
  setViewContact,
  handleEdit,
  handleRestore,
  messagingHandlers,
  allContactsForLinks,
  handleUpdateContact,
  bulkDeleteOpen,
  setBulkDeleteOpen,
  selectedCount,
  confirmBulkDelete,
  deleteTarget,
  setDeleteTarget,
  confirmSingleDelete,
  bulkRestoreOpen,
  setBulkRestoreOpen,
  confirmBulkRestore,
}: {
  canWrite: boolean;
  canDelete: boolean;
  showForm: boolean;
  editContact: Contact | null;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  setShowForm: (open: boolean) => void;
  setEditContact: (contact: Contact | null) => void;
  handleSave: (contact: Contact) => void | Promise<void>;
  showDuplicates: boolean;
  setShowDuplicates: (open: boolean) => void;
  handleMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => Promise<void>;
  messagingTarget: ContactsPageOverlaysProps["messagingTarget"];
  closeComposer: () => void;
  viewContact: Contact | null;
  setViewContact: (contact: Contact | null) => void;
  handleEdit: (contact: Contact) => void;
  handleRestore: (contactId: string | number) => void | Promise<void>;
  messagingHandlers: Pick<ContactsPageOverlaysProps, "onWhatsApp" | "onSms" | "onEmail">;
  allContactsForLinks: Contact[];
  handleUpdateContact: (contact: Contact) => Promise<void>;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
  selectedCount: number;
  confirmBulkDelete: (reason?: string) => void;
  deleteTarget: { id: string | number; name?: string } | null;
  setDeleteTarget: (target: { id: string | number; name?: string } | null) => void;
  confirmSingleDelete: (reason?: string) => void;
  bulkRestoreOpen: boolean;
  setBulkRestoreOpen: (open: boolean) => void;
  confirmBulkRestore: () => void;
}): ContactsPageOverlaysProps {
  return useMemo(
    () => ({
      canWrite,
      canDelete,
      showForm,
      editContact,
      defaultCountry,
      defaultCity,
      defaultProvince,
      onCloseForm: () => {
        setShowForm(false);
        setEditContact(null);
      },
      onSave: handleSave,
      showDuplicates,
      onCloseDuplicates: () => setShowDuplicates(false),
      onMerge: handleMerge,
      messagingTarget,
      onCloseComposer: closeComposer,
      viewContact,
      onCloseView: () => setViewContact(null),
      onEditFromDrawer: (contactToEdit: Contact) => {
        setViewContact(null);
        handleEdit(contactToEdit);
      },
      onRestoreFromDrawer: canDelete
        ? async (contactId: string | number) => {
            try {
              await handleRestore(contactId);
              setViewContact(null);
            } catch {
              // Keep drawer open so the user can retry after a failed restore.
            }
          }
        : undefined,
      onWhatsApp: messagingHandlers.onWhatsApp,
      onSms: messagingHandlers.onSms,
      onEmail: messagingHandlers.onEmail,
      allContactsForLinks,
      onUpdateContact: canWrite ? handleUpdateContact : undefined,
      bulkDeleteOpen,
      onBulkDeleteOpenChange: setBulkDeleteOpen,
      selectedCount,
      onConfirmBulkDelete: confirmBulkDelete,
      deleteTarget,
      onDeleteTargetOpenChange: (open: boolean) => {
        if (!open) setDeleteTarget(null);
      },
      onConfirmSingleDelete: confirmSingleDelete,
      bulkRestoreOpen,
      onBulkRestoreOpenChange: setBulkRestoreOpen,
      onConfirmBulkRestore: confirmBulkRestore,
    }),
    [
      canWrite,
      canDelete,
      showForm,
      editContact,
      defaultCountry,
      defaultCity,
      defaultProvince,
      setShowForm,
      setEditContact,
      handleSave,
      showDuplicates,
      setShowDuplicates,
      handleMerge,
      messagingTarget,
      closeComposer,
      viewContact,
      setViewContact,
      handleEdit,
      handleRestore,
      messagingHandlers,
      allContactsForLinks,
      handleUpdateContact,
      bulkDeleteOpen,
      setBulkDeleteOpen,
      selectedCount,
      confirmBulkDelete,
      deleteTarget,
      setDeleteTarget,
      confirmSingleDelete,
      bulkRestoreOpen,
      setBulkRestoreOpen,
      confirmBulkRestore,
    ],
  );
}
