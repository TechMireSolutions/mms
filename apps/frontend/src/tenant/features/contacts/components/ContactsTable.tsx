import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildContactsMap } from "@/lib/contacts/contactI18n";
import {
  ContactTableRow,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/ContactTableRow";
import { ContactsTableHeader } from "@/tenant/features/contacts/components/ContactsTableHeader";
import { TableBody } from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

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
    <div className={cn(WORK_SURFACE, "overflow-x-auto shadow-xs")}>
      <table className="w-full text-sm table-fixed">
        <ContactsTableHeader
          columns={columns}
          sortField={sortField}
          sortDir={sortDir}
          onSort={onSort}
          getColumnWidth={getColumnWidth}
          setColumnWidth={setColumnWidth}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          t={t}
        />
        <TableBody className="divide-y divide-border/50">
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
        </TableBody>
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
