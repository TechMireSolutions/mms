import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, MessageCircle, MessageSquare,
  Edit2, Trash2, ChevronUp, ChevronDown,
  Copy, Eye, MapPin, User, RotateCcw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, Contact, formatDate } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactCellValue } from '@/lib/contacts/contactI18n';

function GenderIcon({ gender }: { gender?: string }): React.JSX.Element | null {
  if (!gender) return null;
  return <User className="w-3.5 h-3.5 text-muted-foreground inline" />;
}
const ContactDetailDrawer = lazy(() => import("./ContactDetailDrawer"));

import ContactAvatar from "./ContactAvatar";

interface CopyBtnProps {
  text: string;
}

function CopyBtn({ text }: CopyBtnProps): React.JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<boolean>(false);
  const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch((err: unknown) => {
        console.error("Failed to copy text to clipboard:", err);
      });
  };
  return (
    <Button
      onClick={copyToClipboard}
      title={copied ? t('contacts.table.copied') : t('contacts.table.copy')}
      variant="ghost"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
      type="button"
    >
      <Copy className="w-3 h-3" />
    </Button>
  );
}


interface ColumnConfig {
  id: string;
  label: string;
  sortField?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  selected: (number | string)[];
  onSelect: (id: number | string) => void;
  onSelectAll: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number | string) => void;
  onRestore?: (id: number | string) => void;
  showArchived?: boolean;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  columns?: ColumnConfig[];
  allContacts?: Contact[];
  onUpdateContact?: (contact: Contact) => void;
  canWrite?: boolean;
  canDelete?: boolean;
}

/**
 * ContactsTable component displaying contact list in a tabular format with sorting and custom columns.
 *
 * @param props - Component props.
 * @param props.contacts - The filtered/sorted contact list to render.
 * @param props.selected - Selected contact IDs.
 * @param props.onSelect - Callback when selecting a single contact row.
 * @param props.onSelectAll - Callback when checking select-all header.
 * @param props.onEdit - Callback when editing a contact.
 * @param props.onDelete - Callback when deleting a contact.
 * @param props.onWhatsApp - Callback to open WhatsApp dialog.
 * @param props.sortField - Field key currently sorted.
 * @param props.sortDir - Sort direction.
 * @param props.onSort - Callback when a header column is clicked for sorting.
 * @param props.columns - List of visible column configurations.
 * @param props.allContacts - The complete list of system contacts for resolving emergency contacts.
 * @param props.onUpdateContact - Optional callback to handle internal profile updates from the drawer.
 * @returns React.JSX.Element
 */
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
  sortField,
  sortDir,
  onSort,
  columns = [],
  allContacts = [],
  onUpdateContact,
  canWrite = false,
  canDelete = false,
}: ContactsTableProps): React.JSX.Element {
  const { visibleColumns } = useContactConfig();
  const { t } = useTranslation();
  const visibleColumnIds = React.useMemo(
    () => new Set(visibleColumns.map((col) => col.id)),
    [visibleColumns],
  );
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
      className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
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
              <ContactAvatar contact={contact} />
              <div>
                <Button
                  onClick={() => setViewContact(contact)}
                  variant="ghost"
                  className="min-h-[44px] h-auto p-0 text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-left justify-start hover:bg-transparent"
                  type="button"
                >
                  {getDisplayName(contact)}
                </Button>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <GenderIcon gender={contact.gender} />
                  {contact.dob && <span>{t('contacts.table.dobLabel')} {formatDate(contact.dob)}</span>}
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
      case "phone":
        return (
          <td key="phone" className="px-4 py-3">
            <div className="flex items-center gap-2 group/phone">
              {contact.phones?.[0] && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground">{contact.phones[0].countryCode}</span>
                  <span className="text-[12px] font-mono text-foreground font-medium tracking-wide">
                    {contact.phones[0].number?.replace(/(\d{3})(\d{7})/, '$1 $2') || contact.phones[0].number}
                  </span>
                </div>
              )}
              <CopyBtn text={getPrimaryPhone(contact) || ""} />
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
      case "email":
        return (
          <td key="email" className="px-4 py-3">
            <div className="flex items-center gap-1 group/email">
              <span className="text-[13px] text-muted-foreground">{getPrimaryEmail(contact)}</span>
              <CopyBtn text={getPrimaryEmail(contact) || ""} />
            </div>
          </td>
        );
      case "line1":
        return <td key="line1" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{contact.addresses?.[0]?.line1 || (contact.line1 as string) || t('contacts.table.emptyDash')}</span></td>;
      case "city": {
        const cityValue = contact.addresses?.[0]?.city || (contact.city as string);
        return (
          <td key="city" className="px-4 py-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{cityValue || t('contacts.table.emptyDash')}</span>
            </div>
          </td>
        );
      }
      case "gender":
        return (
          <td key="gender" className="px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm text-foreground capitalize">
              <GenderIcon gender={contact.gender} />
              {contact.gender}
            </span>
          </td>
        );
      case "dob":
        return <td key="dob" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{contact.dob ? formatDate(contact.dob) : t('contacts.table.emptyDash')}</span></td>;
      case "state":
        return <td key="state" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{contact.addresses?.[0]?.state || (contact.state as string) || (contact.province as string) || t('contacts.table.emptyDash')}</span></td>;
      case "country":
        return <td key="country" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{contact.addresses?.[0]?.country || (contact.country as string) || t('contacts.table.emptyDash')}</span></td>;
      case "isSyed":
        return (
          <td key="isSyed" className="px-4 py-3">
            {contact.isSyed ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/30">{t('contacts.table.yesSyed')}</span> : <span className="text-muted-foreground/40">{t('contacts.table.emptyDash')}</span>}
          </td>
        );
      case "whatsapp":
        return <td key="whatsapp" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{hasWhatsApp(contact) ? t('common.yes') : t('common.no')}</span></td>;
      case "socials_platform": {
        const platforms = (contact.socials || []).map((social) => social.platform).filter(Boolean);
        return <td key="socials_platform" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{platforms.join(", ") || t('contacts.table.emptyDash')}</span></td>;
      }
      case "socials_url": {
        const urls = (contact.socials || []).map((social) => social.url).filter(Boolean);
        return <td key="socials_url" className="px-4 py-3"><span className="text-[13px] text-muted-foreground truncate max-w-[150px] block" title={urls.join(", ")}>{urls.join(", ") || t('contacts.table.emptyDash')}</span></td>;
      }
      case "emergency_contact": {
        const emergencyContactNames = (contact.emergencyContacts || []).map((emergencyContact) => {
          if (emergencyContact.name) return emergencyContact.name;
          if (emergencyContact.contactId) {
            const linkedContact = allContacts.find((contact) => String(contact.id) === String(emergencyContact.contactId));
            return linkedContact ? linkedContact.name : `${t('contacts.table.contactIdPrefix')}${emergencyContact.contactId}`;
          }
          return null;
        }).filter(Boolean);
        return <td key="emergency_contact" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{emergencyContactNames.join(", ") || t('contacts.table.emptyDash')}</span></td>;
      }
      case "emergency_relationship": {
        const relationships = (contact.emergencyContacts || []).map((emergencyContact) => emergencyContact.relationship).filter(Boolean);
        return <td key="emergency_relationship" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{relationships.join(", ") || t('contacts.table.emptyDash')}</span></td>;
      }

      default:
        return <td key={col.id} className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{formatContactCellValue(contact[col.id], t)}</span></td>;
    }
  };
  const COL_SORT_FIELD: Record<string, string> = {
    name: "name",
    isSyed: "isSyed",
    city: "city",
    gender: "gender",
    dob: "dob",
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={someSelected ? "indeterminate" : allSelected}
                  onCheckedChange={() => onSelectAll()}
                  className="cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                COL_SORT_FIELD[col.id]
                  ? <TH key={col.id} field={COL_SORT_FIELD[col.id]}>{col.label}</TH>
                  : <th key={col.id} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</th>
              ))}
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <AnimatePresence>
              {contacts.map((contact) => {
                const isSelected = selected.includes(contact.id);
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
                            <Eye className="w-3.5 h-3.5 mr-2" /> {t('contacts.table.viewProfile')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(contact)} disabled={!canWrite || showArchived}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> {t('contacts.table.edit')}
                          </DropdownMenuItem>
                          {!showArchived ? (
                            <>
                              <DropdownMenuItem disabled={!hasWhatsApp(contact)} onClick={() => onWhatsApp([contact])}>
                                <MessageCircle className={`w-3.5 h-3.5 mr-2 ${hasWhatsApp(contact) ? "text-success" : "text-muted-foreground"}`} /> {t('contacts.whatsapp')}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={!getPrimaryPhone(contact)} onClick={() => onSms([contact])}>
                                <MessageSquare className="w-3.5 h-3.5 mr-2 text-primary" /> {t("contacts.sms")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(contact.id)} disabled={!canDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('contacts.table.deleteContact')}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => onRestore?.(contact.id)} disabled={!canDelete}>
                              <RotateCcw className="w-3.5 h-3.5 mr-2" /> {t("contacts.restoreContact")}
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
              allContacts={allContacts}
              onUpdateContact={canWrite ? onUpdateContact : undefined}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
