import React, { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getDisplayName, 
  getPrimaryEmail,
  hasWhatsApp, 
  Contact,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildContactsMap, resolveContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

export interface ContactsColumnConfig {
  id: string;
  label: string;
  sortField?: string;
  width?: number;
}

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

function columnWidthStyle(width: number | undefined): React.CSSProperties | undefined {
  if (typeof width !== "number") return undefined;
  return { width, minWidth: width, maxWidth: width };
}

/**
 * Accessible table header cell with sort direction indicators and aria-sort state
 */
const TableHeaderCell = memo(function TableHeaderCell({
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

interface ContactTableRowProps {
  contact: Contact;
  isSelected: boolean;
  columns: ContactsColumnConfig[];
  getColumnWidth: (key: string) => number | undefined;
  prefs: ReturnType<typeof useContactConfig>["prefs"];
  countryCodesMap: ReturnType<typeof useContactConfig>["countryCodesMap"];
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

/**
 * Memoized contact table row component to prevent redundant re-renders
 */
const ContactTableRow = memo(function ContactTableRow({
  contact,
  isSelected,
  columns,
  getColumnWidth,
  prefs,
  countryCodesMap,
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

  const renderCell = (col: ContactsColumnConfig): React.JSX.Element => {
    const width = getColumnWidth(col.id) ?? col.width;
    const widthStyle = columnWidthStyle(width);

    switch (col.id) {
      case "name":
        return (
          <td key="name" className="px-4 py-3 sticky start-12 z-10 bg-card group-hover:bg-muted/40 transition-colors border-e border-border/30" style={widthStyle}>
            <div className="flex items-center gap-3">
              <UserAvatar
                id={contact.id}
                name={displayName}
                avatar={contact.avatar}
                className="w-8 h-8 rounded-full text-xs"
              />
              <div>
                <Button
                  onClick={() => onView?.(contact)}
                  variant="ghost"
                  className="min-h-[44px] h-auto p-0 text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  type="button"
                >
                  {displayName}
                </Button>
                <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} className="mt-0.5" />
                {showArchived && contact.deletionReason && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {t('contacts.deletionReasonLabel')}: {contact.deletionReason}
                  </p>
                )}
              </div>
            </div>
          </td>
        );
      case "phone": {
        const { phone: primaryPhone, countryCode, phoneDisplay: formattedNumber } = resolveContactPhoneDisplay(contact, prefs, countryCodesMap);
        const hasWa = hasWhatsApp(contact);

        return (
          <td key="phone" className="px-4 py-3" style={widthStyle}>
            <div className="flex items-center gap-2 group/phone">
              {primaryPhone ? (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60">
                  {countryCode && <span className="text-[11px] font-semibold text-muted-foreground">{countryCode}</span>}
                  <span className="text-[12px] font-mono text-foreground font-medium tracking-wide">
                    {formattedNumber}
                  </span>
                </div>
              ) : (
                <span className="text-[13px] text-muted-foreground">{t('contacts.table.emptyDash')}</span>
              )}
              {primaryPhone && <CopyBtn text={primaryPhone} />}
              {onWhatsApp && hasWa ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp([contact]);
                }}
                title={t('contacts.whatsapp')}
                aria-label={t('contacts.whatsapp')}
                variant="ghost"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 transition-all hover:bg-transparent opacity-0 group-hover/phone:opacity-100 text-success hover:text-success/80 cursor-pointer"
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
              ) : null}
            </div>
          </td>
        );
      }
      case "email": {
        const primaryEmail = getPrimaryEmail(contact);
        return (
          <td key="email" className="px-4 py-3" style={widthStyle}>
            <div className="flex items-center gap-1 group/email">
              <span className="text-[13px] text-muted-foreground">{primaryEmail || t('contacts.table.emptyDash')}</span>
              {primaryEmail && <CopyBtn text={primaryEmail} />}
            </div>
          </td>
        );
      }
      default:
        return (
          <ContactMetadataCell
            key={col.id}
            colId={col.id}
            contact={contact}
            prefs={prefs}
            allContacts={allContacts}
            contactsMap={contactsMap}
            variant="table"
            style={widthStyle}
          />
        );
    }
  };

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
      {columns.map(renderCell)}
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
  const { prefs, countryCodesMap, getColumnWidth, setColumnWidth } = useContactConfig();
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
            ? `${selected.length} / ${contacts.length} ${t('contacts.table.selectedCount')}`
            : `${contacts.length} ${contacts.length !== 1 ? t('contacts.table.contacts') : t('contacts.form.contact')}`}
        </p>
      </div>
    </div>
  );
}
