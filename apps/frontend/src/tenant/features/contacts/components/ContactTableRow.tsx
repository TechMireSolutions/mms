import React, { memo } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell } from "@/components/ui/table";
import { getDisplayName, Contact, type ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { renderContactTableCell } from "@/tenant/features/contacts/components/ContactTableCells";
import {
  columnWidthStyle,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/contactTableTypes";

export type { ContactsColumnConfig };
export { columnWidthStyle };
export { TableHeaderCell } from "@/tenant/features/contacts/components/ContactTableHeaderCell";

export interface ContactTableRowProps {
  contact: Contact;
  isSelected: boolean;
  columns: ContactsColumnConfig[];
  getColumnWidth: (key: string) => number | undefined;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
  showArchived: boolean;
  canWrite: boolean;
  canDelete: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  onSelect: (id: number | string) => void;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: number | string) => void;
  onRestore?: (contactId: number | string) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}

export const ContactTableRow = memo(function ContactTableRow({
  contact,
  isSelected,
  columns,
  getColumnWidth,
  prefs,
  countryCodesMap,
  countryCodes,
  contactsMap,
  allContacts,
  showArchived,
  canWrite,
  canDelete,
  t,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onWhatsApp,
  onSms,
  onEmail,
}: ContactTableRowProps): React.JSX.Element {
  const displayName = getDisplayName(contact);

  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/5" : ""}`}
    >
      <TableCell className="w-12 min-w-12 px-4 py-3 sticky start-0 z-20 bg-card group-hover:bg-muted/40 transition-colors border-e border-border/30">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(contact.id)}
          aria-label={t("contacts.table.selectContact", { name: displayName })}
          className="cursor-pointer"
        />
      </TableCell>
      {columns.map((col) =>
        renderContactTableCell({
          col,
          contact,
          displayName,
          getColumnWidth,
          prefs,
          countryCodesMap,
          countryCodes,
          contactsMap,
          allContacts,
          showArchived,
          t,
          onView,
          onWhatsApp,
        }),
      )}
      <TableCell className="px-4 py-3">
        <ContactActionMenu
          contact={contact}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onWhatsApp={onWhatsApp}
          onSms={onSms}
          onEmail={onEmail}
          showArchived={showArchived}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      </TableCell>
    </motion.tr>
  );
});
