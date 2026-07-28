import { useMemo, type ComponentProps } from "react";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
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
  handleUpdateContact,
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
  handleUpdateContact: (contact: Contact) => Promise<void>;
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
      allSelected: workContacts.length > 0 && selected.length === workContacts.length,
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
      handleUpdateContact,
      canWrite,
      canDelete,
      tableColumns,
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
    ],
  );

  return { messagingHandlers, commonDirectoryProps, tableProps };
}
