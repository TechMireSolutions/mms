import React, { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  User,
  MessageCircle,
  CheckCircle2,
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
import { buildContactsMap, formatContactGenderLabel, resolveContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { ContactActionMenu } from "@/tenant/features/contacts/components/ContactActionMenu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyBtn } from "@/components/ui/CopyBtn";

export interface ColumnConfig {
  id: string;
  label: string;
  sortField?: string;
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
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onEmail: (contacts: Contact[]) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  columns?: ColumnConfig[];
  allContacts?: Contact[];
  canWrite?: boolean;
  canDelete?: boolean;
}

interface TableHeaderCellProps {
  field: string;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible table header cell with sort direction indicators and aria-sort state
 */
const TableHeaderCell = memo(function TableHeaderCell({
  field,
  sortField,
  sortDir,
  onSort,
  children,
  className,
}: TableHeaderCellProps): React.JSX.Element {
  const isSorted = sortField === field;
  const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th
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
    </th>
  );
});

interface ContactTableRowProps {
  contact: Contact;
  isSelected: boolean;
  columns: ColumnConfig[];
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
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onEmail: (contacts: Contact[]) => void;
}

/**
 * Memoized contact table row component to prevent redundant re-renders
 */
const ContactTableRow = memo(function ContactTableRow({
  contact,
  isSelected,
  columns,
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

  const renderCell = (col: ColumnConfig): React.JSX.Element => {
    switch (col.id) {
      case "name":
        return (
          <td key="name" className="px-4 py-3 sticky left-12 z-10 bg-card group-hover:bg-muted/40 transition-colors border-r border-border/30">
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
                {(contact.gender || contact.isSyed) && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap leading-normal mt-0.5">
                    {contact.gender && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground inline" />
                        <span>{formatContactGenderLabel(contact.gender, t)}</span>
                      </span>
                    )}
                    {contact.gender && contact.isSyed && <span className="text-muted-foreground/40">•</span>}
                    {contact.isSyed && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {t("contacts.table.yesSyed")}
                      </span>
                    )}
                  </p>
                )}
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
          <td key="phone" className="px-4 py-3">
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
              <Button
                disabled={!hasWa}
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp([contact]);
                }}
                title={hasWa ? t('contacts.whatsapp') : t('contacts.table.notRegisteredWhatsApp')}
                aria-label={hasWa ? t('contacts.whatsapp') : t('contacts.table.notRegisteredWhatsApp')}
                variant="ghost"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-0 transition-all hover:bg-transparent ${
                  hasWa
                    ? "opacity-0 group-hover/phone:opacity-100 text-success hover:text-success/80 cursor-pointer"
                    : "opacity-30 group-hover/phone:opacity-60 text-muted-foreground cursor-not-allowed"
                }`}
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </div>
          </td>
        );
      }
      case "email": {
        const primaryEmail = getPrimaryEmail(contact);
        return (
          <td key="email" className="px-4 py-3">
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
      <td className="w-12 min-w-12 px-4 py-3 sticky left-0 z-20 bg-card group-hover:bg-muted/40 transition-colors border-r border-border/30">
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
  const { prefs, countryCodesMap } = useContactConfig();
  const { t } = useTranslation();

  const contactsMap = useMemo(() => buildContactsMap(allContacts), [allContacts]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const allSelected = contacts.length > 0 && selected.length === contacts.length;
  const someSelected = selected.length > 0 && selected.length < contacts.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-12 min-w-12 px-4 py-3 sticky left-0 z-20 bg-muted/95 backdrop-blur-md border-r border-border/30">
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
              const stickyClass = isNameCol ? "sticky left-12 z-20 bg-muted/95 backdrop-blur-md border-r border-border/30" : "";

              return sortFieldKey ? (
                <TableHeaderCell
                  key={col.id}
                  field={sortFieldKey}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={onSort}
                  className={stickyClass}
                >
                  {col.label}
                </TableHeaderCell>
              ) : (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide ${stickyClass}`}
                >
                  {col.label}
                </th>
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
