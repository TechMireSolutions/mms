import React, { useState, lazy, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal, MessageCircle, MessageSquare, Edit2, Trash2, Eye, Phone, Mail, RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { 
  type Contact, 
  formatDate,
  getDisplayName, 
  getPrimaryEmail, 
  hasWhatsApp,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { formatContactDobWithAge, resolveContactPhoneDisplay, getContactAccentBarClass, formatTelHref } from "@/lib/contacts/contactI18n";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyBtn } from "@/components/ui/CopyBtn";

const MotionButton = motion.create(Button);

const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));

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
  onEmail: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  canWrite?: boolean;
  canDelete?: boolean;
  columns?: ColumnConfig[];
  onSelectAll?: () => void;
  allSelected?: boolean;
  onUpdateContact?: (contact: Contact) => Promise<void>;
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
  onEmail,
  allContacts = [],
  canWrite = false,
  canDelete = false,
  columns = [],
  onSelectAll,
  allSelected = false,
  onUpdateContact,
}: ContactCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { prefs, countryCodesMap } = useContactConfig();
  const [viewContact, setViewContact] = useState<Contact | null>(null);

  const visibleColumnIds = useMemo(
    () => new Set(columns.map((col) => col.id)),
    [columns]
  );

  const showPhonePill = !columns.length || visibleColumnIds.has("phone");
  const showEmailPill = !columns.length || visibleColumnIds.has("email");

  // Exclude core fields that are already displayed in the card header or as primary pills
  const otherColumns = useMemo(
    () => columns.filter(
      (col) => col.id !== "name" && col.id !== "phone" && col.id !== "email"
    ),
    [columns]
  );

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
          const displayName = getDisplayName(contact);
          const { phone, countryCode, phoneDisplay } = resolveContactPhoneDisplay(contact, prefs, countryCodesMap);
          const email = getPrimaryEmail(contact);

          return (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
              role="region"
              aria-label={displayName}
              className={`relative overflow-hidden group rounded-2xl border bg-gradient-to-br from-card/95 via-card/85 to-background/70 dark:from-card/95 dark:via-card/80 dark:to-background/60 backdrop-blur-xl p-4 ps-5.5 space-y-4 transition-all duration-300 shadow-sm hover:shadow-md ${isSelected
                  ? "border-primary/50 bg-primary/[0.015] dark:bg-primary/[0.02] shadow-sm shadow-primary/5"
                  : "border-border/50 dark:border-border/30 hover:border-primary/35 dark:hover:border-primary/20"
                }`}
            >
              <div 
                aria-hidden="true"
                className={`absolute start-0 top-0 bottom-0 w-1.5 ${getContactAccentBarClass(isSelected, contact.gender)} transition-colors duration-300`} 
              />
 
              {/* Core Profile Area */}
              <div className="flex gap-3 pe-16 items-start ms-1">
                <div className="flex items-center justify-center flex-shrink-0 pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(contact.id)}
                    aria-label={t("contacts.table.selectContact", { name: displayName })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
                  onClick={() => setViewContact(contact)}
                  aria-label={t("contacts.table.viewProfile")}
                >
                    <UserAvatar
                      id={contact.id}
                      name={displayName}
                      avatar={contact.avatar}
                      className="w-11 h-11 rounded-2xl text-sm shadow-inner group-hover:scale-105 transition-transform duration-200"
                    />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                      {displayName}
                    </h4>
                    {contact.dob && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {formatContactDobWithAge(contact.dob, t)}
                      </p>
                    )}
                  </div>
                </Button>
              </div>
 
              {/* Contact Information Pills */}
              {(showPhonePill || showEmailPill) && (
                <div className="space-y-2 py-0.5 ms-1">
                  {phone && showPhonePill && (
                    <div className="w-full flex items-center justify-between text-xs font-normal text-muted-foreground bg-muted/40 dark:bg-muted/20 hover:bg-muted/65 dark:hover:bg-muted/35 hover:text-foreground backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/30 dark:border-border/15 transition-all group/pill min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
                        <Phone aria-hidden="true" className="w-3.5 h-3.5 text-primary/80 dark:text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors" />
                        <span className="font-semibold tracking-tight truncate select-all">
                          {countryCode ? `${countryCode} ${phoneDisplay}` : (phoneDisplay || phone)}
                        </span>
                      </div>
                      <CopyBtn text={phone} showToast className="h-6 w-6 opacity-60 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground" />
                    </div>
                  )}
                  {email && showEmailPill && (
                    <div className="w-full flex items-center justify-between text-xs font-normal text-muted-foreground bg-muted/40 dark:bg-muted/20 hover:bg-muted/65 dark:hover:bg-muted/35 hover:text-foreground backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/30 dark:border-border/15 transition-all group/pill min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
                        <Mail aria-hidden="true" className="w-3.5 h-3.5 text-primary/80 dark:text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors" />
                        <span className="font-semibold tracking-tight truncate select-all">{email}</span>
                      </div>
                      <CopyBtn text={email} showToast className="h-6 w-6 opacity-60 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground" />
                    </div>
                  )}
                </div>
              )}
 
              {/* Dynamic Metadata Section */}
              {otherColumns.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
                  {otherColumns.map((col) => {
                    const value = contact[col.id as keyof Contact];
                    // Skip empty custom values unless they are booleans/ratings
                    if (value === undefined || value === null || (value === "" && col.id !== "rating")) return null;
                    return (
                      <div key={col.id} className="flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
                          {col.label}
                        </span>
                        <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                          <ContactMetadataCell colId={col.id} contact={contact} prefs={prefs} allContacts={allContacts} variant="card" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
 
              {/* Archived Warning Banner */}
              {contact.deletedAt && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1 text-[11px] text-destructive text-start">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t("contacts.table.deletedAt", { date: formatDate(contact.deletedAt) })}</span>
                  </div>
                  {contact.deletionReason && (
                    <p className="font-semibold opacity-90 italic">
                      {t("contacts.deletionReasonLabel")}: {contact.deletionReason}
                    </p>
                  )}
                </div>
              )}
 
              {/* Action Toolbar */}
              <div className="pt-3 border-t border-border/40 dark:border-border/20 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {phone ? (
                    <motion.a
                      href={formatTelHref(phone)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl border border-border/50 dark:border-border/30 bg-muted/40 dark:bg-card/60 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-colors shadow-xs"
                      title={t("contacts.detail.call")}
                      aria-label={t("contacts.detail.call")}
                    >
                      <Phone aria-hidden="true" className="w-4 h-4" />
                    </motion.a>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-border/20 bg-card/20 text-muted-foreground/30 cursor-not-allowed opacity-40">
                      <Phone aria-hidden="true" className="w-4 h-4" />
                    </div>
                  )}
 
                  <MotionButton
                    type="button"
                    variant="ghost"
                    disabled={!hasWhatsApp(contact)}
                    whileHover={hasWhatsApp(contact) ? { scale: 1.05 } : undefined}
                    whileTap={hasWhatsApp(contact) ? { scale: 0.95 } : undefined}
                    onClick={() => onWhatsApp([contact])}
                    className={`h-auto p-2.5 rounded-xl border transition-colors shadow-none ${hasWhatsApp(contact)
                        ? "border-success/30 dark:border-success/20 bg-success/5 text-success hover:text-success hover:bg-success/10 cursor-pointer"
                        : "border-border/20 text-muted-foreground/30 opacity-40 cursor-not-allowed"
                      }`}
                    title={t("contacts.whatsapp")}
                    aria-label={t("contacts.whatsapp")}
                  >
                    <MessageCircle aria-hidden="true" className="w-4 h-4" />
                  </MotionButton>
 
                  <MotionButton
                    type="button"
                    variant="ghost"
                    disabled={!phone}
                    whileHover={phone ? { scale: 1.05 } : undefined}
                    whileTap={phone ? { scale: 0.95 } : undefined}
                    onClick={() => onSms([contact])}
                    className={`h-auto p-2.5 rounded-xl border transition-colors shadow-none ${phone
                        ? "border-primary/30 dark:border-primary/20 bg-primary/5 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                        : "border-border/20 text-muted-foreground/30 opacity-40 cursor-not-allowed"
                      }`}
                    title={t("contacts.sms")}
                    aria-label={t("contacts.sms")}
                  >
                    <MessageSquare aria-hidden="true" className="w-4 h-4" />
                  </MotionButton>

                  <MotionButton
                    type="button"
                    variant="ghost"
                    disabled={!email}
                    whileHover={email ? { scale: 1.05 } : undefined}
                    whileTap={email ? { scale: 0.95 } : undefined}
                    onClick={() => onEmail([contact])}
                    className={`h-auto p-2.5 rounded-xl border transition-colors shadow-none ${email
                        ? "border-secondary/30 dark:border-secondary/20 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/10 cursor-pointer"
                        : "border-border/20 text-muted-foreground/30 opacity-40 cursor-not-allowed"
                      }`}
                    title={t("contacts.detail.emailAction")}
                    aria-label={t("contacts.detail.emailAction")}
                  >
                    <Mail aria-hidden="true" className="w-4 h-4" />
                  </MotionButton>
                </div>
 
                <div className="flex items-center gap-1.5">
                  <MotionButton
                    type="button"
                    variant="outline"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewContact(contact)}
                    className="flex items-center h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
                    aria-label={t("contacts.table.viewProfile")}
                  >
                    <Eye aria-hidden="true" className="w-3.5 h-3.5" />
                    <span>{t("contacts.table.viewProfile")}</span>
                  </MotionButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MotionButton
                        type="button"
                        variant="outline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer h-auto shadow-none"
                        aria-label={t("contacts.table.actions")}
                      >
                        <MoreHorizontal aria-hidden="true" className="w-4 h-4" />
                      </MotionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {canWrite && !showArchived && (
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Edit2 aria-hidden="true" className="w-3.5 h-3.5 me-2" /> {t("contacts.table.edit")}
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
                              <Trash2 aria-hidden="true" className="w-3.5 h-3.5 me-2" /> {t("contacts.table.deleteContact")}
                            </DropdownMenuItem>
                          </>
                        )
                      ) : (
                        canDelete && (
                          <DropdownMenuItem onClick={() => onRestore?.(contact.id)}>
                            <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 me-2" /> {t("contacts.restoreContact")}
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
            onEmail={onEmail}
            allContacts={allContacts}
            onUpdateContact={onUpdateContact}
          />
        </Suspense>
      )}
    </>
  );
}

