import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildContactsMap } from "@/lib/contacts/contactI18n";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import {
  ContactTableRow,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/ContactTableRow";
import { ContactsTableHeader } from "@/tenant/features/contacts/components/ContactsTableHeader";
import { Table, TableBody } from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
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
  allSelected?: boolean;
  someSelected?: boolean;
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
  allSelected = false,
  someSelected = false,
}: ContactsTableProps): React.JSX.Element {
  const { prefs, countryCodesMap, countryCodes, getColumnWidth, setColumnWidth } = useContactConfig();
  const { t } = useTranslation();

  const contactsMap = useMemo(() => buildContactsMap(allContacts), [allContacts]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const pageCountLabel = formatDirectoryPageCountLabel(contacts.length, t, {
    singular: "contacts.form.contact",
    plural: "contacts.table.contacts",
  });

  return (
    <div className={cn(WORK_SURFACE, "shadow-xs")}>
      <Table className="table-fixed">
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
      </Table>

      <ModuleTableFooterCount
        selectedCount={selected.length}
        selectedCountLabel={t("contacts.selectedCount", { count: selected.length })}
        pageCountLabel={pageCountLabel}
      />
    </div>
  );
}
