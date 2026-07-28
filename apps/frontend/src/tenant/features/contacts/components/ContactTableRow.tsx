import React, { memo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getDisplayName, Contact, type ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { renderContactTableCell } from "@/tenant/features/contacts/components/ContactTableCells";
import {
  columnWidthStyle,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/contactTableTypes";

export type { ContactsColumnConfig };
export { columnWidthStyle };

interface TableHeaderCellProps {
  columnKey: string;
  field: string;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  width?: number;
  onResize?: (columnKey: string, width: number) => void;
  children: React.ReactNode;
  className?: string;
}

export const TableHeaderCell = memo(function TableHeaderCell({
  columnKey,
  field,
  sortField,
  sortDir,
  onSort,
  width,
  onResize,
  children,
  className,
}: TableHeaderCellProps): React.JSX.Element {
  const isSorted = sortField === field;
  const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <ResizableTableHead
      columnKey={columnKey}
      width={width}
      onResize={onResize}
      aria-sort={ariaSort}
      className={`px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors ${className || ""}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isSorted ? (
          sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3 text-primary" />
          ) : (
            <ChevronDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ChevronUp className="w-3 h-3 opacity-20" />
        )}
      </div>
    </ResizableTableHead>
  );
});

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
      className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/[0.02]" : ""}`}
    >
      <td className="w-12 min-w-12 px-4 py-3 sticky start-0 z-20 bg-card group-hover:bg-muted/40 transition-colors border-e border-border/30">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(contact.id)}
          aria-label={t("contacts.table.selectContact", { name: displayName })}
          className="cursor-pointer"
        />
      </td>
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
      <td className="px-4 py-3">
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
      </td>
    </motion.tr>
  );
});
