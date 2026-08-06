import { useMemo, type ComponentProps } from "react";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import { getDirectoryPageSelection } from "@/tenant/features/contacts/hooks/contactsDirectorySelection";
import type { Contact } from "@mms/shared";

export function useContactsPageDirectoryProps({
  workContacts,
  selected,
  handleSelect,
  handleSelectAll,
  setViewContact,
  handleEdit,
  handleDelete,
  handleRestore,
  viewingDeleted,
  canWriteMessaging,
  handleWhatsApp,
  handleSms,
  handleEmail,
  allContactsForLinks,
  canWrite,
  canDelete,
  tableColumns,
  sortField,
  sortDir,
  handleSort,
}: {
  workContacts: Contact[];
  selected: Array<string | number>;
  handleSelect: (id: string | number) => void;
  handleSelectAll: () => void;
  setViewContact: (contact: Contact | null) => void;
  handleEdit: (contact: Contact) => void;
  handleDelete: (id: string | number) => void;
  handleRestore: (id: string | number) => void;
  viewingDeleted: boolean;
  canWriteMessaging: boolean;
  handleWhatsApp: (contacts: Contact[]) => void;
  handleSms: (contacts: Contact[]) => void;
  handleEmail: (contacts: Contact[]) => void;
  allContactsForLinks: Contact[];
  canWrite: boolean;
  canDelete: boolean;
  tableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
  sortField: string;
  sortDir: "asc" | "desc";
  handleSort: (field: string) => void;
}) {
  const messagingHandlers = useMemo(() => {
    if (!canWriteMessaging || viewingDeleted) {
      return { onWhatsApp: undefined, onSms: undefined, onEmail: undefined };
    }
    return { onWhatsApp: handleWhatsApp, onSms: handleSms, onEmail: handleEmail };
  }, [canWriteMessaging, viewingDeleted, handleWhatsApp, handleSms, handleEmail]);

  const pageSelection = useMemo(
    () =>
      getDirectoryPageSelection(
        workContacts.map((contact) => contact.id),
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
      onView: setViewContact,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onRestore: handleRestore,
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
      setViewContact,
      handleEdit,
      handleDelete,
      handleRestore,
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
      onView: setViewContact,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onRestore: handleRestore,
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
      setViewContact,
      handleEdit,
      handleDelete,
      handleRestore,
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
