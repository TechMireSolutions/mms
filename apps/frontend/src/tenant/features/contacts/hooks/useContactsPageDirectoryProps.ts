import { useMemo, type ComponentProps } from "react";
import type { Contact } from "@mms/shared";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import { getDirectoryPageSelection } from "@/tenant/features/contacts/hooks/contactsDirectorySelection";
import type { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import type { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import type { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import type { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";

type Directory = ReturnType<typeof useContactsDirectory>;
type Overlay = ReturnType<typeof useContactsPageOverlayState>;
type Messaging = ReturnType<typeof useContactsMessagingActions>;
type Actions = ReturnType<typeof useContactsPageActions>;

/** Builds ContactCards / ContactsTable props from page directory slices. */
export function useContactsPageDirectoryProps({
  directory,
  overlay,
  messaging,
  actions,
  viewingDeleted,
  canWrite,
  canDelete,
  tableColumns,
}: {
  directory: Directory;
  overlay: Pick<Overlay, "setViewContact">;
  messaging: Pick<Messaging, "canWriteMessaging" | "handleWhatsApp" | "handleSms" | "handleEmail">;
  actions: Pick<Actions, "handleEdit" | "handleDelete" | "handleRestore">;
  viewingDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  tableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
}) {
  const {
    workContacts,
    selected,
    handleSelect,
    handleSelectAll,
    allContactsForLinks,
    sortField,
    sortDir,
    handleSort,
  } = directory;

  const messagingHandlers = useMemo(() => {
    if (!messaging.canWriteMessaging || viewingDeleted) {
      return { onWhatsApp: undefined, onSms: undefined, onEmail: undefined };
    }
    return {
      onWhatsApp: messaging.handleWhatsApp,
      onSms: messaging.handleSms,
      onEmail: messaging.handleEmail,
    };
  }, [
    messaging.canWriteMessaging,
    messaging.handleWhatsApp,
    messaging.handleSms,
    messaging.handleEmail,
    viewingDeleted,
  ]);

  const pageSelection = useMemo(
    () =>
      getDirectoryPageSelection(
        workContacts.map((contact: Contact) => contact.id),
        selected,
      ),
    [workContacts, selected],
  );

  const commonDirectoryProps = useMemo(
    (): ComponentProps<typeof ContactCards> => ({
      contacts: workContacts,
      selected,
      onSelect: handleSelect,
      onSelectAll: handleSelectAll,
      onView: overlay.setViewContact,
      onEdit: actions.handleEdit,
      onDelete: actions.handleDelete,
      onRestore: actions.handleRestore,
      showArchived: viewingDeleted,
      ...messagingHandlers,
      allContacts: allContactsForLinks,
      canWrite,
      canDelete,
      columns: tableColumns,
      allSelected: pageSelection.allSelected,
      someSelected: pageSelection.someSelected,
    }),
    [
      workContacts,
      selected,
      handleSelect,
      handleSelectAll,
      overlay.setViewContact,
      actions.handleEdit,
      actions.handleDelete,
      actions.handleRestore,
      viewingDeleted,
      messagingHandlers,
      allContactsForLinks,
      canWrite,
      canDelete,
      tableColumns,
      pageSelection,
    ],
  );

  const tableProps = useMemo(
    (): ComponentProps<typeof ContactsTable> => ({
      contacts: workContacts,
      selected,
      onSelect: handleSelect,
      onSelectAll: handleSelectAll,
      onView: overlay.setViewContact,
      onEdit: actions.handleEdit,
      onDelete: actions.handleDelete,
      onRestore: actions.handleRestore,
      showArchived: viewingDeleted,
      ...messagingHandlers,
      allContacts: allContactsForLinks,
      canWrite,
      canDelete,
      columns: tableColumns,
      sortField,
      sortDir,
      onSort: handleSort,
      allSelected: pageSelection.allSelected,
      someSelected: pageSelection.someSelected,
    }),
    [
      workContacts,
      selected,
      handleSelect,
      handleSelectAll,
      overlay.setViewContact,
      actions.handleEdit,
      actions.handleDelete,
      actions.handleRestore,
      viewingDeleted,
      messagingHandlers,
      allContactsForLinks,
      canWrite,
      canDelete,
      tableColumns,
      sortField,
      sortDir,
      handleSort,
      pageSelection,
    ],
  );

  return { messagingHandlers, commonDirectoryProps, tableProps };
}
