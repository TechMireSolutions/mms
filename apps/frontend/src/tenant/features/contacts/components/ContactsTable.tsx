import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildContactsMap } from "@/lib/contacts/contactI18n";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import {
  ContactTableRow,
  TableHeaderCell,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/ContactTableRow";

export type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";

export interface ContactsTableProps {
  contacts: Contact[];
  selected: (number | string)[];
  onSelect: (contactId: number | string) => void;
  onSelectAll: () => void;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: number | string) => void;
  onRestore?: (contactId: number | string) => void;
  showArchived?: boolean;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  columns?: ContactsColumnConfig[];
  allContacts?: Contact[];
  canWrite?: boolean;
  canDelete?: boolean;
}

export default function ContactsTable({
  contacts,
  selected,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
  showArchived = false,
  onWhatsApp,
  onSms,
  onEmail,
  sortField,
  sortDir,
  onSort,
  columns = [],
  allContacts = [],
  canWrite = false,
  canDelete = false,
}: ContactsTableProps): React.JSX.Element {
  const { prefs, countryCodesMap, countryCodes, getColumnWidth, setColumnWidth } = useContactConfig();
  const { t } = useTranslation();

  const contactsMap = useMemo(() => buildContactsMap(allContacts), [allContacts]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const allSelected = contacts.length > 0 && selected.length === contacts.length;
  const someSelected = selected.length > 0 && selected.length < contacts.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xs">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-12 min-w-12 px-4 py-3 sticky start-0 z-20 bg-muted/95 backdrop-blur-md border-e border-border/30">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={() => onSelectAll()}
                aria-label={allSelected ? t("contacts.deselect") : t("contacts.table.selectAll")}
                className="cursor-pointer"
              />
            </th>
            {columns.map((col) => {
              const sortFieldKey = col.sortField || col.id;
              const isNameCol = col.id === "name";
              const stickyClass = isNameCol ? "sticky start-12 z-20 bg-muted/95 backdrop-blur-md border-e border-border/30" : "";
              const width = getColumnWidth(col.id) ?? col.width;

              return sortFieldKey ? (
                <TableHeaderCell
                  key={col.id}
                  columnKey={col.id}
                  field={sortFieldKey}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={onSort}
                  width={width}
                  onResize={setColumnWidth}
                  className={stickyClass}
                >
                  {col.label}
                </TableHeaderCell>
              ) : (
                <ResizableTableHead
                  key={col.id}
                  columnKey={col.id}
                  width={width}
                  onResize={setColumnWidth}
                  className={`px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide ${stickyClass}`}
                >
                  {col.label}
                </ResizableTableHead>
              );
            })}
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          <AnimatePresence>
            {contacts.map((contact) => (
              <ContactTableRow
                key={contact.id}
                contact={contact}
                isSelected={selectedSet.has(contact.id)}
                columns={columns}
                getColumnWidth={getColumnWidth}
                prefs={prefs}
                countryCodesMap={countryCodesMap}
                countryCodes={countryCodes}
                contactsMap={contactsMap}
                allContacts={allContacts}
                showArchived={showArchived}
                canWrite={canWrite}
                canDelete={canDelete}
                t={t}
                onSelect={onSelect}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                onWhatsApp={onWhatsApp}
                onSms={onSms}
                onEmail={onEmail}
              />
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between bg-muted/5">
        <p className="text-xs text-muted-foreground">
          {selected.length > 0
            ? `${selected.length} / ${contacts.length} ${t("contacts.table.selectedCount")}`
            : `${contacts.length} ${contacts.length !== 1 ? t("contacts.table.contacts") : t("contacts.form.contact")}`}
        </p>
      </div>
    </div>
  );
}
