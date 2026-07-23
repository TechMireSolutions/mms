import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  User,
  MessageCircle,
  Eye,
  Edit2,
  Mail,
  MessageSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getDisplayName, 
  getPrimaryPhone,
  getPrimaryEmail, 
  hasWhatsApp, 
  Contact,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactDobWithAge, resolveContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyBtn } from "@/components/ui/CopyBtn";

const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));



interface ColumnConfig {
  id: string;
  label: string;
  sortField?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  selected: (number | string)[];
  onSelect: (contactId: number | string) => void;
  onSelectAll: () => void;
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
  onUpdateContact?: (contact: Contact) => Promise<void>;
  canWrite?: boolean;
  canDelete?: boolean;
}

export default function ContactsTable({
  contacts,
  selected,
  onSelect,
  onSelectAll,
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
  onUpdateContact,
  canWrite = false,
  canDelete = false,
}: ContactsTableProps): React.JSX.Element {
  const { prefs, countryCodesMap } = useContactConfig();
  const { t } = useTranslation();
  const [viewContact, setViewContact] = useState<Contact | null>(null);

  const allSelected  = contacts.length > 0 && selected.length === contacts.length;
  const someSelected = selected.length > 0 && selected.length < contacts.length;

  const SortIcon = ({ field }: { field: string }): React.JSX.Element => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const TH = ({ field, children }: { field: string; children: React.ReactNode }): React.JSX.Element => (
    <th
      className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">{children}<SortIcon field={field} /></div>
    </th>
  );

  const renderCell = (col: ColumnConfig, contact: Contact): React.JSX.Element => {
    switch (col.id) {
      case "name":
        return (
          <td key="name" className="px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                id={contact.id}
                name={getDisplayName(contact)}
                avatar={contact.avatar}
                className="w-8 h-8 rounded-full text-xs"
              />
              <div>
                <Button
                  onClick={() => setViewContact(contact)}
                  variant="ghost"
                  className="min-h-[44px] h-auto p-0 text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  type="button"
                >
                  {getDisplayName(contact)}
                </Button>
                 <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap leading-normal">
                  {contact.gender && <User className="w-3.5 h-3.5 text-muted-foreground inline" />}
                  {contact.dob && <span>{formatContactDobWithAge(contact.dob, t)}</span>}
                </p>
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
              <CopyBtn text={primaryPhone || ""} />
              <Button
                disabled={!hasWhatsApp(contact)}
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp([contact]);
                }}
                title={hasWhatsApp(contact) ? t('contacts.whatsapp') : t('contacts.table.notRegisteredWhatsApp')}
                variant="ghost"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-0 transition-all hover:bg-transparent ${
                  hasWhatsApp(contact)
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
      case "email":
        return (
          <td key="email" className="px-4 py-3">
            <div className="flex items-center gap-1 group/email">
              <span className="text-[13px] text-muted-foreground">{getPrimaryEmail(contact)}</span>
              <CopyBtn text={getPrimaryEmail(contact) || ""} />
            </div>
          </td>
        );
      default:
        return (
          <ContactMetadataCell
            key={col.id}
            colId={col.id}
            contact={contact}
            prefs={prefs}
            allContacts={allContacts}
            variant="table"
          />
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={someSelected ? "indeterminate" : allSelected}
                  onCheckedChange={() => onSelectAll()}
                  aria-label={allSelected ? t("contacts.deselect") : t("contacts.table.selectAll")}
                  className="cursor-pointer"
                />
              </th>
              {columns.map((col) => {
                const sortFieldKey = col.sortField || col.id;
                return sortFieldKey ? (
                  <TH key={col.id} field={sortFieldKey}>{col.label}</TH>
                ) : (
                  <th key={col.id} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</th>
                );
              })}
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <AnimatePresence>
              {contacts.map((contact) => {
                const isSelected = selected.includes(contact.id);
                const primaryEmailVal = getPrimaryEmail(contact);
                return (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(contact.id)}
                        aria-label={t("contacts.table.selectContact", { name: getDisplayName(contact) })}
                        className="cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => renderCell(col, contact))}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="min-w-[44px] min-h-[44px] p-0 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" type="button" aria-label={t('contacts.table.actions')}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setViewContact(contact)}>
                            <Eye className="w-3.5 h-3.5 me-2" /> {t('contacts.table.viewProfile')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(contact)} disabled={!canWrite || showArchived}>
                            <Edit2 className="w-3.5 h-3.5 me-2" /> {t('contacts.table.edit')}
                          </DropdownMenuItem>
                          {!showArchived ? (
                            <>
                              <DropdownMenuItem disabled={!hasWhatsApp(contact)} onClick={() => onWhatsApp([contact])}>
                                <MessageCircle className={`w-3.5 h-3.5 me-2 ${hasWhatsApp(contact) ? "text-success" : "text-muted-foreground"}`} /> {t('contacts.whatsapp')}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={!primaryEmailVal} onClick={() => onEmail([contact])}>
                                <Mail className={`w-3.5 h-3.5 me-2 ${primaryEmailVal ? "text-warning" : "text-muted-foreground"}`} /> {t("contacts.detail.emailAction")}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={!getPrimaryPhone(contact)} onClick={() => onSms([contact])}>
                                <MessageSquare className="w-3.5 h-3.5 me-2 text-primary" /> {t("contacts.sms")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(contact.id)} disabled={!canDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5 me-2" /> {t('contacts.table.deleteContact')}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => onRestore?.(contact.id)} disabled={!canDelete}>
                              <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("contacts.restoreContact")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between bg-muted/5">
          <p className="text-xs text-muted-foreground">
            {selected.length > 0 ? `${selected.length} / ${contacts.length} ${t('contacts.table.selectedCount')}` : `${contacts.length} ${contacts.length !== 1 ? t('contacts.table.contacts') : t('contacts.form.contact')}`}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <AnimatePresence>
          {viewContact && (
            <ContactDetailDrawer
              contact={viewContact}
              onClose={() => setViewContact(null)}
              onEdit={(contact) => { setViewContact(null); if (canWrite) onEdit(contact); }}
              onWhatsApp={onWhatsApp}
              onSms={onSms}
              onEmail={onEmail}
              allContacts={allContacts}
              onUpdateContact={canWrite ? onUpdateContact : undefined}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
