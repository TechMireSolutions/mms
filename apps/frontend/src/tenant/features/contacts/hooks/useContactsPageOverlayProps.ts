import { useMemo } from "react";
import type { Contact } from "@mms/shared";
import type { ContactsPageOverlaysProps } from "@/tenant/features/contacts/components/ContactsPageOverlays";
import type { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import type { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import type { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";

type Overlay = ReturnType<typeof useContactsPageOverlayState>;
type Messaging = ReturnType<typeof useContactsMessagingActions>;
type Actions = ReturnType<typeof useContactsPageActions>;

/** Maps overlay / action slices into ContactsPageOverlaysProps. */
export function useContactsPageOverlayProps({
  canWrite,
  canDelete,
  prefs,
  overlay,
  messaging,
  actions,
  messagingHandlers,
  allContactsForLinks,
  selectedCount,
}: {
  canWrite: boolean;
  canDelete: boolean;
  prefs?: {
    defaultCountry?: string;
    defaultCity?: string;
    defaultProvince?: string;
  };
  overlay: Overlay;
  messaging: Pick<Messaging, "messagingTarget" | "closeComposer">;
  actions: Pick<
    Actions,
    | "handleSave"
    | "handleMerge"
    | "handleEdit"
    | "handleRestore"
    | "handleUpdateContact"
    | "confirmBulkDelete"
    | "confirmSingleDelete"
    | "confirmBulkRestore"
  >;
  messagingHandlers: Pick<ContactsPageOverlaysProps, "onWhatsApp" | "onSms" | "onEmail">;
  allContactsForLinks: Contact[];
  selectedCount: number;
}): ContactsPageOverlaysProps {
  const defaultCountry = prefs?.defaultCountry || "";
  const defaultCity = prefs?.defaultCity || "";
  const defaultProvince = prefs?.defaultProvince || "";

  const currentViewContact = useMemo(() => {
    if (!overlay.viewContact) return null;
    const fresh = allContactsForLinks.find(
      (c) => String(c.id) === String(overlay.viewContact?.id),
    );
    return fresh ?? overlay.viewContact;
  }, [overlay.viewContact, allContactsForLinks]);

  return useMemo(
    () => ({
      canWrite,
      canDelete,
      showForm: overlay.showForm,
      editContact: overlay.editContact,
      defaultCountry,
      defaultCity,
      defaultProvince,
      onCloseForm: () => {
        overlay.setShowForm(false);
        overlay.setEditContact(null);
      },
      onSave: actions.handleSave,
      showDuplicates: overlay.showDuplicates,
      onCloseDuplicates: () => overlay.setShowDuplicates(false),
      onMerge: actions.handleMerge,
      messagingTarget: messaging.messagingTarget,
      onCloseComposer: messaging.closeComposer,
      viewContact: currentViewContact,
      onCloseView: () => overlay.setViewContact(null),
      onEditFromDrawer: (contactToEdit: Contact) => {
        overlay.setViewContact(null);
        actions.handleEdit(contactToEdit);
      },
      onRestoreFromDrawer: canDelete
        ? async (contactId: string | number) => {
            try {
              await actions.handleRestore(contactId);
              overlay.setViewContact(null);
            } catch {
              // Keep drawer open so the user can retry after a failed restore.
            }
          }
        : undefined,
      onWhatsApp: messagingHandlers.onWhatsApp,
      onSms: messagingHandlers.onSms,
      onEmail: messagingHandlers.onEmail,
      allContactsForLinks,
      onUpdateContact: canWrite ? actions.handleUpdateContact : undefined,
      bulkDeleteOpen: overlay.bulkDeleteOpen,
      onBulkDeleteOpenChange: overlay.setBulkDeleteOpen,
      selectedCount,
      onConfirmBulkDelete: actions.confirmBulkDelete,
      deleteTarget: overlay.deleteTarget,
      onDeleteTargetOpenChange: (open: boolean) => {
        if (!open) overlay.setDeleteTarget(null);
      },
      onConfirmSingleDelete: actions.confirmSingleDelete,
      bulkRestoreOpen: overlay.bulkRestoreOpen,
      onBulkRestoreOpenChange: overlay.setBulkRestoreOpen,
      onConfirmBulkRestore: actions.confirmBulkRestore,
    }),
    [
      canWrite,
      canDelete,
      overlay,
      defaultCountry,
      defaultCity,
      defaultProvince,
      actions,
      messaging,
      currentViewContact,
      messagingHandlers,
      allContactsForLinks,
      selectedCount,
    ],
  );
}
