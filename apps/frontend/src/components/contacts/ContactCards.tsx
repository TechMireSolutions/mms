import React, { useState, lazy, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, MessageCircle, MessageSquare, Edit2, Trash2, Eye, Phone, Mail, RotateCcw, Copy, Check,
  MapPin, User, Star, Calendar, CheckCircle2
} from "lucide-react";
import { type Contact, formatDate } from "@mms/shared";
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { notify } from "@/lib/notify";
import ContactAvatar from "./ContactAvatar";
import { formatContactCellValue } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const MotionButton = motion(Button);

const ContactDetailDrawer = lazy(() => import("./ContactDetailDrawer"));

interface ColumnConfig {
  id: string;
  label: string;
}

interface ContactCardsProps {
  contacts: Contact[];
  selected: (string | number)[];
  onSelect: (id: string | number) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  showArchived?: boolean;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  canWrite?: boolean;
  canDelete?: boolean;
  columns?: ColumnConfig[];
  onSelectAll?: () => void;
  allSelected?: boolean;
}

/** Mobile-first card directory with dynamic, config-driven preferences (globle1.md §3.3). */
export default function ContactCards({
  contacts,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onRestore,
  showArchived = false,
  onWhatsApp,
  onSms,
  allContacts = [],
  canWrite = false,
  canDelete = false,
  columns = [],
  onSelectAll,
  allSelected = false,
}: ContactCardsProps): React.JSX.Element {
  const { lifecycleColors, lifecycleStages } = useContactConfig();
  const { t } = useTranslation();
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const visibleColumnIds = useMemo(
    () => new Set(columns.map((col) => col.id)),
    [columns]
  );

  const showPhonePill = !columns.length || visibleColumnIds.has("phone");
  const showEmailPill = !columns.length || visibleColumnIds.has("email");

  // Exclude core fields that are already displayed in the card header or as primary pills
  const otherColumns = useMemo(
    () => columns.filter(
      (col) => col.id !== "name" && col.id !== "lifecycleStage" && col.id !== "phone" && col.id !== "email"
    ),
    [columns]
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      notify.success(t("contacts.table.copied"));
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {
      // ignore
    });
  };

  const renderMetadataValue = (colId: string, item: Contact): React.ReactNode => {
    switch (colId) {
      case "gender": {
        const val = item.gender;
        if (!val) return <span className="text-muted-foreground/40">—</span>;
        return (
          <span className="flex items-center gap-1 capitalize">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {val}
          </span>
        );
      }
      case "isSyed":
        return item.isSyed ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-success/10 text-success rounded border border-success/20">
            <CheckCircle2 className="w-3 h-3" />
            {t("contacts.table.yesSyed")}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      case "rating": {
        const r = item.rating || 0;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < r
                    ? "text-amber-500 fill-amber-500"
                    : "text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        );
      }
      case "city":
      case "country":
      case "state":
      case "line1": {
        const val = item.addresses?.[0]?.[colId as "city" | "country" | "state" | "line1"] || item[colId as keyof Contact];
        if (!val) return <span className="text-muted-foreground/40">—</span>;
        return (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span className="truncate">{String(val)}</span>
          </span>
        );
      }
      case "dob":
        return item.dob ? (
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            {formatDate(item.dob)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      case "whatsapp":
        return (
          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
            hasWhatsApp(item)
              ? "bg-success/10 text-success border-success/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {hasWhatsApp(item) ? t("common.yes") : t("common.no")}
          </span>
        );
      case "socials_platform": {
        const platforms = (item.socials || []).map((s) => s.platform).filter(Boolean);
        return platforms.length > 0 ? (
          <span className="truncate">{platforms.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      }
      case "socials_url": {
        const urls = (item.socials || []).map((s) => s.url).filter(Boolean);
        return urls.length > 0 ? (
          <span className="truncate" title={urls.join(", ")}>{urls.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      }
      case "emergency_contact": {
        const ecNames = (item.emergencyContacts || []).map((ec) => {
          if (ec.name) return ec.name;
          if (ec.contactId) {
            const linked = allContacts.find((x) => String(x.id) === String(ec.contactId));
            return linked ? linked.name : `${t("contacts.table.contactIdPrefix")}${ec.contactId}`;
          }
          return null;
        }).filter(Boolean);
        return ecNames.length > 0 ? (
          <span className="truncate">{ecNames.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      }
      case "emergency_relationship": {
        const relationships = (item.emergencyContacts || []).map((ec) => ec.relationship).filter(Boolean);
        return relationships.length > 0 ? (
          <span className="truncate">{relationships.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      }
      default: {
        const raw = item[colId as keyof Contact];
        return <span>{formatContactCellValue(raw, t)}</span>;
      }
    }
  };

  return (
    <>
      {onSelectAll && contacts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card/65 backdrop-blur-md rounded-2xl border border-border/40 mb-3.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Checkbox
              checked={allSelected ? true : (selected.length > 0 ? "indeterminate" : false)}
              onCheckedChange={onSelectAll}
              id="select-all-cards"
            />
            <label htmlFor="select-all-cards" className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-foreground transition-colors">
              {allSelected ? t("contacts.deselect") : t("contacts.table.selectAll")}
            </label>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/10">
            {contacts.length} {contacts.length === 1 ? t("contacts.form.contact") : t("contacts.table.contacts")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contacts.map((contact) => {
          const isSelected = selected.includes(contact.id);
          const stage = contact.lifecycleStage || lifecycleStages[0] || "";
          const stageColors = lifecycleColors[stage] || {
            bg: "bg-muted text-muted-foreground border-border",
            text: "text-muted-foreground",
            border: "border-border",
          };
          const phone = getPrimaryPhone(contact);
          const email = getPrimaryEmail(contact);

          return (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card/95 via-card/80 to-background/60 backdrop-blur-xl p-4 space-y-4 transition-all duration-300 shadow-sm hover:shadow-md ${
                isSelected 
                  ? "border-primary/45 bg-primary/[0.02] shadow-sm shadow-primary/5" 
                  : "border-border/30 hover:border-primary/20"
              }`}
            >
              {/* Stage Badge */}
              <span className={`absolute top-4 right-4 text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border shadow-sm flex items-center justify-center ${stageColors.bg}`}>
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
                {stage}
              </span>

              {/* Core Profile Area */}
              <div className="flex gap-3 pr-16 items-start">
                <div className="flex items-center justify-center flex-shrink-0 pt-0.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(contact.id)}
                    aria-label={getDisplayName(contact)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-left cursor-pointer group hover:text-foreground shadow-none justify-start"
                  onClick={() => setViewContact(contact)}
                >
                  <div className="relative animate-none">
                    <ContactAvatar contact={contact} className="w-11 h-11 rounded-2xl text-sm shadow-inner group-hover:scale-105 transition-transform duration-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                      {getDisplayName(contact)}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                      {stage}
                    </p>
                  </div>
                </Button>
              </div>

              {/* Contact Information Pills */}
              {(showPhonePill || showEmailPill) && (
                <div className="space-y-2 py-0.5">
                  {phone && showPhonePill && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleCopy(phone, `phone:${contact.id}`)}
                      className="w-full flex items-center justify-between h-auto text-xs font-normal text-muted-foreground bg-muted/30 hover:bg-muted/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-border/15 transition-all group/pill cursor-pointer min-w-0 shadow-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <Phone className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors" />
                        <span className="font-medium tracking-tight truncate select-all">{phone}</span>
                      </div>
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <AnimatePresence mode="wait">
                          {copiedKey === `phone:${contact.id}` ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                            >
                              <Check className="w-3.5 h-3.5 text-success" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              className="opacity-0 group-hover/pill:opacity-100 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground/35" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Button>
                  )}
                  {email && showEmailPill && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleCopy(email, `email:${contact.id}`)}
                      className="w-full flex items-center justify-between h-auto text-xs font-normal text-muted-foreground bg-muted/30 hover:bg-muted/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-border/15 transition-all group/pill cursor-pointer min-w-0 shadow-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <Mail className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors" />
                        <span className="font-medium tracking-tight truncate select-all">{email}</span>
                      </div>
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <AnimatePresence mode="wait">
                          {copiedKey === `email:${contact.id}` ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                            >
                              <Check className="w-3.5 h-3.5 text-success" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              className="opacity-0 group-hover/pill:opacity-100 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground/35" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Button>
                  )}
                </div>
              )}

              {/* Dynamic Metadata Section */}
              {otherColumns.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/10">
                  {otherColumns.map((col) => {
                    const value = contact[col.id as keyof Contact];
                    // Skip empty custom values unless they are booleans/ratings
                    if (value === undefined || value === null || (value === "" && col.id !== "rating")) return null;
                    return (
                      <div key={col.id} className="flex flex-col gap-0.5 bg-muted/20 px-2.5 py-1.5 rounded-xl border border-border/10 text-left min-w-0">
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">{col.label}</span>
                        <div className="text-[12px] font-bold text-foreground truncate mt-0.5">
                          {renderMetadataValue(col.id, contact)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Archived Warning Banner */}
              {contact.deletedAt && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1 text-[11px] text-destructive text-left">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircleWarningIcon className="w-3.5 h-3.5" />
                    <span>Deleted {formatDate(contact.deletedAt)}</span>
                  </div>
                  {contact.deletionReason && (
                    <p className="font-semibold opacity-90 italic">
                      Reason: {contact.deletionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-border/30 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {phone ? (
                    <motion.a
                      href={`tel:${phone}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl border border-border/40 bg-card/60 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-colors shadow-sm"
                      title={t("contacts.detail.call")}
                    >
                      <Phone className="w-4 h-4" />
                    </motion.a>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-border/20 bg-card/20 text-muted-foreground/30 cursor-not-allowed opacity-40">
                      <Phone className="w-4 h-4" />
                    </div>
                  )}

                  <MotionButton
                    type="button"
                    variant="ghost"
                    disabled={!hasWhatsApp(contact)}
                    whileHover={hasWhatsApp(contact) ? { scale: 1.05 } : undefined}
                    whileTap={hasWhatsApp(contact) ? { scale: 0.95 } : undefined}
                    onClick={() => onWhatsApp([contact])}
                    className={`h-auto p-2.5 rounded-xl border transition-colors shadow-none ${
                      hasWhatsApp(contact)
                        ? "border-success/20 bg-success/5 text-success hover:bg-success/10 cursor-pointer"
                        : "border-border/20 text-muted-foreground/30 opacity-40 cursor-not-allowed"
                    }`}
                    title={t("contacts.whatsapp")}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </MotionButton>

                  <MotionButton
                    type="button"
                    variant="ghost"
                    disabled={!phone}
                    whileHover={phone ? { scale: 1.05 } : undefined}
                    whileTap={phone ? { scale: 0.95 } : undefined}
                    onClick={() => onSms([contact])}
                    className={`h-auto p-2.5 rounded-xl border transition-colors shadow-none ${
                      phone
                        ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                        : "border-border/20 text-muted-foreground/30 opacity-40 cursor-not-allowed"
                    }`}
                    title={t("contacts.sms")}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </MotionButton>
                </div>

                <div className="flex items-center gap-1.5">
                  <MotionButton
                    type="button"
                    variant="outline"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewContact(contact)}
                    className="flex items-center h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/40 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t("contacts.table.viewProfile")}</span>
                  </MotionButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MotionButton
                        type="button"
                        variant="outline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 rounded-xl border border-border/40 hover:bg-muted text-muted-foreground transition-colors cursor-pointer h-auto shadow-none"
                        aria-label={t("contacts.table.actions")}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </MotionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {canWrite && !showArchived && (
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> {t("contacts.table.edit")}
                        </DropdownMenuItem>
                      )}
                      {!showArchived ? (
                        canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(contact.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> {t("contacts.table.deleteContact")}
                            </DropdownMenuItem>
                          </>
                        )
                      ) : (
                        canDelete && (
                          <DropdownMenuItem onClick={() => onRestore?.(contact.id)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> {t("contacts.restoreContact")}
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {viewContact && (
        <Suspense fallback={null}>
          <ContactDetailDrawer
            contact={viewContact}
            onClose={() => setViewContact(null)}
            onEdit={onEdit}
            onWhatsApp={onWhatsApp}
            onSms={onSms}
            allContacts={allContacts}
          />
        </Suspense>
      )}
    </>
  );
}

// Small inner warning icon
function AlertCircleWarningIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
