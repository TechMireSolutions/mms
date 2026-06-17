import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, MessageCircle, MessageSquare,
  Edit2, Trash2, ChevronUp, ChevronDown,
  Copy, Eye, MapPin, Mars, Venus, User
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { calculateProfileHealth, useContactConfig } from '@/lib/contexts/ContactConfigContext';

function GenderIcon({ gender }: { gender?: string }): React.JSX.Element | null {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g === "male") return <Mars className="w-3.5 h-3.5 text-muted-foreground inline" />;
  if (g === "female") return <Venus className="w-3.5 h-3.5 text-muted-foreground inline" />;
  return <User className="w-3.5 h-3.5 text-muted-foreground inline" />;
}

// Drawer only loads when a contact is actually clicked
const ContactDetailDrawer = lazy(() => import("./ContactDetailDrawer"));

import ContactAvatar from "./ContactAvatar";

interface CopyBtnProps {
  text: string;
  uiStrings: Record<string, string>;
}

/**
 * Copy button component copying text to clipboard.
 */
function CopyBtn({ text, uiStrings }: CopyBtnProps): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);
  const copy = (e: React.MouseEvent<HTMLButtonElement>): void => {
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
    <button
      onClick={copy}
      title={copied ? uiStrings.copied : uiStrings.copy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
      type="button"
    >
      <Copy className="w-3 h-3" />
    </button>
  );
}

/**
 * Formats basic cell values for tabular display.
 */
function formatCellValue(val: unknown, uiStrings: Record<string, string>): string {
  if (val === null || val === undefined || val === "") return uiStrings.emptyDash;
  if (typeof val === "boolean") return val ? uiStrings.yes : uiStrings.no;
  if (Array.isArray(val)) return val.join(", ") || uiStrings.emptyDash;
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch (err: unknown) {
      console.error("Failed to stringify cell value:", err);
      return uiStrings.emptyDash;
    }
  }
  return String(val);
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
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  columns?: ColumnConfig[];
  allContacts?: Contact[];
  onUpdateContact?: (contact: Contact) => void;
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
  onWhatsApp,
  onSms,
  sortField,
  sortDir,
  onSort,
  columns = [],
  allContacts = [],
  onUpdateContact,
}: ContactsTableProps): React.JSX.Element {
  const { lifecycleColors, uiStrings } = useContactConfig();
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

  const renderCell = (col: ColumnConfig, c: Contact): React.JSX.Element => {
    switch (col.id) {
      case "name":
        return (
          <td key="name" className="px-4 py-3">
            <div className="flex items-center gap-3">
              <ContactAvatar contact={c} uiStrings={uiStrings} />
              <div>
                <button
                  onClick={() => setViewContact(c)}
                  className="min-h-[44px] text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-left"
                  type="button"
                >
                  {getDisplayName(c)}
                </button>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <GenderIcon gender={c.gender} />
                  {c.dob && <span>{uiStrings.dobLabel} {formatDate(c.dob)}</span>}
                </p>
              </div>
            </div>
          </td>
        );
      case "phone":
        return (
          <td key="phone" className="px-4 py-3">
            <div className="flex items-center gap-2 group/phone">
              {c.phones?.[0] && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground">{c.phones[0].countryCode}</span>
                  <span className="text-[12px] font-mono text-foreground font-medium tracking-wide">
                    {c.phones[0].number?.replace(/(\d{3})(\d{7})/, '$1 $2') || c.phones[0].number}
                  </span>
                </div>
              )}
              <CopyBtn text={getPrimaryPhone(c) || ""} uiStrings={uiStrings} />
              <button
                disabled={!hasWhatsApp(c)}
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp([c]);
                }}
                title={hasWhatsApp(c) ? uiStrings.whatsapp : uiStrings.notRegisteredWhatsApp}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                  hasWhatsApp(c)
                    ? "opacity-0 group-hover/phone:opacity-100 text-success hover:text-success/80 cursor-pointer"
                    : "opacity-30 group-hover/phone:opacity-60 text-muted-foreground cursor-not-allowed"
                }`}
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        );
      case "email":
        return (
          <td key="email" className="px-4 py-3">
            <div className="flex items-center gap-1 group/email">
              <span className="text-[13px] text-muted-foreground">{getPrimaryEmail(c)}</span>
              <CopyBtn text={getPrimaryEmail(c) || ""} uiStrings={uiStrings} />
            </div>
          </td>
        );
      case "line1":
        return <td key="line1" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{c.addresses?.[0]?.line1 || (c.line1 as string) || uiStrings.emptyDash}</span></td>;
      case "city": {
        const cityVal = c.addresses?.[0]?.city || (c.city as string);
        return (
          <td key="city" className="px-4 py-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{cityVal || uiStrings.emptyDash}</span>
            </div>
          </td>
        );
      }
      case "gender":
        return (
          <td key="gender" className="px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm text-foreground capitalize">
              <GenderIcon gender={c.gender} />
              {c.gender}
            </span>
          </td>
        );
      case "dob":
        return <td key="dob" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{c.dob ? formatDate(c.dob) : uiStrings.emptyDash}</span></td>;
      case "state":
        return <td key="state" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{c.addresses?.[0]?.state || (c.state as string) || (c.province as string) || uiStrings.emptyDash}</span></td>;
      case "country":
        return <td key="country" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{c.addresses?.[0]?.country || (c.country as string) || uiStrings.emptyDash}</span></td>;
      case "isSyed":
        return (
          <td key="isSyed" className="px-4 py-3">
            {c.isSyed ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/30">{uiStrings.yesSyed}</span> : <span className="text-muted-foreground/40">{uiStrings.emptyDash}</span>}
          </td>
        );
      case "whatsapp":
        return <td key="whatsapp" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{hasWhatsApp(c) ? uiStrings.yes : uiStrings.no}</span></td>;
      case "socials_platform": {
        const platforms = (c.socials || []).map((s) => s.platform).filter(Boolean);
        return <td key="socials_platform" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{platforms.join(", ") || uiStrings.emptyDash}</span></td>;
      }
      case "socials_url": {
        const urls = (c.socials || []).map((s) => s.url).filter(Boolean);
        return <td key="socials_url" className="px-4 py-3"><span className="text-[13px] text-muted-foreground truncate max-w-[150px] block" title={urls.join(", ")}>{urls.join(", ") || uiStrings.emptyDash}</span></td>;
      }
      case "emergency_contact": {
        const ecNames = (c.emergencyContacts || []).map((ec) => {
          if (ec.name) return ec.name;
          if (ec.contactId) {
            const linked = allContacts.find((x) => String(x.id) === String(ec.contactId));
            return linked ? linked.name : `${uiStrings.contactIdPrefix}${ec.contactId}`;
          }
          return null;
        }).filter(Boolean);
        return <td key="emergency_contact" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{ecNames.join(", ") || uiStrings.emptyDash}</span></td>;
      }
      case "emergency_relationship": {
        const relationships = (c.emergencyContacts || []).map((ec) => ec.relationship).filter(Boolean);
        return <td key="emergency_relationship" className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{relationships.join(", ") || uiStrings.emptyDash}</span></td>;
      }
      case "profileHealth": {
        const health = calculateProfileHealth(c);
        return (
          <td key="profileHealth" className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-12 bg-muted h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${health >= 80 ? (uiStrings.healthBgHigh || "bg-success") : health >= 50 ? (uiStrings.healthBgMedium || "bg-warning") : (uiStrings.healthBgLow || "bg-destructive")}`} style={{ width: `${health}%` }} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">{health}%</span>
            </div>
          </td>
        );
      }
      case "lifecycleStage": {
        const stage = c.lifecycleStage || uiStrings.defaultLifecycleStage;
        const colors = lifecycleColors[stage] || { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground" };
        return (
          <td key="lifecycleStage" className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors.bg}`}>
              {stage}
            </span>
          </td>
        );
      }
      case "rating": {
        const r = c.rating || 0;
        return (
          <td key="rating" className="px-4 py-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < r ? (uiStrings.ratingActiveText || "text-warning font-bold") : (uiStrings.ratingInactiveText || "text-muted-foreground/30 font-light")}`}
                >
                  ★
                </span>
              ))}
            </div>
          </td>
        );
      }
      default:
        return <td key={col.id} className="px-4 py-3"><span className="text-[13px] text-muted-foreground">{formatCellValue(c[col.id], uiStrings)}</span></td>;
    }
  };

  // Only columns that are actually sortable
  const COL_SORT_FIELD: Record<string, string> = {
    name: "name",
    isSyed: "isSyed",
    city: "city",
    gender: "gender",
    dob: "dob",
    profileHealth: "profileHealth",
    lifecycleStage: "lifecycleStage",
    rating: "rating",
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={() => onSelectAll()}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
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
              {contacts.map((c) => {
                const isSelected = selected.includes(c.id);
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(c.id)}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => renderCell(col, c))}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" type="button" aria-label={uiStrings.actions}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setViewContact(c)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> {uiStrings.viewProfile}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(c)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> {uiStrings.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!hasWhatsApp(c)} onClick={() => onWhatsApp([c])}>
                            <MessageCircle className={`w-3.5 h-3.5 mr-2 ${hasWhatsApp(c) ? "text-success" : "text-muted-foreground"}`} /> {uiStrings.whatsapp}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!getPrimaryPhone(c)} onClick={() => onSms([c])}>
                            <MessageSquare className="w-3.5 h-3.5 mr-2 text-primary" /> {uiStrings.sms}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(c.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> {uiStrings.deleteContact}
                          </DropdownMenuItem>
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
            {selected.length > 0 ? `${selected.length} / ${contacts.length} ${uiStrings.selectedCount}` : `${contacts.length} ${contacts.length !== 1 ? uiStrings.contacts : uiStrings.contact}`}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <AnimatePresence>
          {viewContact && (
            <ContactDetailDrawer
              contact={viewContact}
              onClose={() => setViewContact(null)}
              onEdit={(c) => { setViewContact(null); onEdit(c); }}
              onWhatsApp={onWhatsApp}
              onSms={onSms}
              allContacts={allContacts}
              onUpdateContact={onUpdateContact}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
