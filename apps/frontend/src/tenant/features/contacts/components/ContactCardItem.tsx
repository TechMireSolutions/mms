import { motion } from "framer-motion";
import {
  Phone, Mail,
  AlertTriangle,
} from "lucide-react";
import {
  type Contact,
  type ContactPreferences,
  formatDate,
  getDisplayName,
  getPrimaryEmail,
} from "@mms/shared";
import {
  resolveContactPhoneDisplay,
  getContactAccentBarClass,
} from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { ContactCardActions } from "@/tenant/features/contacts/components/ContactCardActions";
import { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";
import { useTranslation } from "@/hooks/useTranslation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyBtn } from "@/components/ui/CopyBtn";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";

export { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";

export const contactCardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

function ContactInfoPill({
  icon: Icon,
  text,
  copyText,
}: {
  icon: typeof Phone | typeof Mail;
  text: string;
  copyText: string;
}) {
  return (
    <div className="w-full flex items-center justify-between text-xs font-normal text-muted-foreground bg-muted/40 dark:bg-muted/20 hover:bg-muted/65 dark:hover:bg-muted/35 hover:text-foreground backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/30 dark:border-border/15 transition-all group/pill min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
        <Icon aria-hidden="true" className="w-3.5 h-3.5 text-primary/80 dark:text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors" />
        <span className="font-semibold tracking-tight truncate select-all">{text}</span>
      </div>
      <CopyBtn text={copyText} showToast className="h-6 w-6 opacity-60 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground" />
    </div>
  );
}

export interface ContactCardItemProps {
  contact: Contact;
  isSelected: boolean;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
  showPhonePill: boolean;
  showEmailPill: boolean;
  otherColumns: ContactsColumnConfig[];
  visibleColumnIds: Set<string>;
  showArchived: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onSelect: (id: string | number) => void;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}

export function ContactCardItem({
  contact,
  isSelected,
  prefs,
  countryCodesMap,
  countryCodes,
  contactsMap,
  allContacts,
  showPhonePill,
  showEmailPill,
  otherColumns,
  visibleColumnIds,
  showArchived,
  canWrite,
  canDelete,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onWhatsApp,
  onSms,
  onEmail,
}: ContactCardItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const displayName = getDisplayName(contact);
  const { phone, countryCode, phoneDisplay } = resolveContactPhoneDisplay(
    contact,
    prefs,
    countryCodesMap,
    countryCodes,
  );
  const email = getPrimaryEmail(contact);

  return (
    <motion.div
      layout
      variants={contactCardItemVariants}
      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
      role="region"
      aria-label={displayName}
      className={`relative overflow-hidden group rounded-2xl border bg-gradient-to-br from-card/95 via-card/85 to-background/70 dark:from-card/95 dark:via-card/80 dark:to-background/60 backdrop-blur-xl p-4 ps-5.5 space-y-4 transition-all duration-300 shadow-xs hover:shadow-md ${isSelected
        ? "border-primary/50 bg-primary/[0.025] dark:bg-primary/[0.03] shadow-xs shadow-primary/5"
        : "border-border/50 dark:border-border/30 hover:border-primary/35 dark:hover:border-primary/20"
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute start-0 top-0 bottom-0 w-1.5 ${getContactAccentBarClass(isSelected, contact.gender)} transition-colors duration-300`}
      />

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
          onClick={() => onView?.(contact)}
          aria-label={`${t("contacts.table.viewProfile")} - ${displayName}`}
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
            <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} className="mt-0.5 font-semibold truncate" />
          </div>
        </Button>
      </div>

      {(showPhonePill || showEmailPill) && (
        <div className="space-y-2 py-0.5 ms-1">
          {phone && showPhonePill && (
            <ContactInfoPill
              icon={Phone}
              text={countryCode ? `${countryCode} ${phoneDisplay}` : (phoneDisplay || phone)}
              copyText={phone}
            />
          )}
          {email && showEmailPill && (
            <ContactInfoPill
              icon={Mail}
              text={email}
              copyText={email}
            />
          )}
        </div>
      )}

      {otherColumns.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
          {otherColumns.map((col) => {
            if (col.id === "socials_url" && visibleColumnIds.has("socials_platform")) {
              return null;
            }
            if (col.id === "emergency_relationship" && visibleColumnIds.has("emergency_contact")) {
              return null;
            }
            if (!hasContactCardColumnData(contact, col.id)) return null;
            const colLabel = col.id === "socials_platform" || col.id === "socials_url"
              ? t("contacts.detail.socials")
              : (col.id === "emergency_contact" || col.id === "emergency_relationship"
                ? t("contacts.form.tabEmergency")
                : col.label);
            return (
              <div key={col.id} className="flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
                  {colLabel}
                </span>
                <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                  <ContactMetadataCell colId={col.id} contact={contact} prefs={prefs} allContacts={allContacts} contactsMap={contactsMap} variant="card" />
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      <ContactCardActions
        contact={contact}
        displayName={displayName}
        phone={phone}
        email={email}
        showArchived={showArchived}
        canWrite={canWrite}
        canDelete={canDelete}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onWhatsApp={onWhatsApp}
        onSms={onSms}
        onEmail={onEmail}
      />
    </motion.div>
  );
}
