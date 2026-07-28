import { AlertTriangle, Mail, Phone } from "lucide-react";
import { formatDate, type Contact, type ContactPreferences } from "@mms/shared";
import { CopyBtn } from "@/components/ui/CopyBtn";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";

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
        <Icon
          aria-hidden="true"
          className="w-3.5 h-3.5 text-primary/80 dark:text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors"
        />
        <span className="font-semibold tracking-tight truncate select-all">{text}</span>
      </div>
      <CopyBtn
        text={copyText}
        showToast
        className="h-6 w-6 opacity-60 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}

export function ContactCardInfoPills({
  phone,
  countryCode,
  phoneDisplay,
  email,
  showPhonePill,
  showEmailPill,
}: {
  phone: string | null;
  countryCode: string;
  phoneDisplay: string;
  email: string | null;
  showPhonePill: boolean;
  showEmailPill: boolean;
}) {
  if (!showPhonePill && !showEmailPill) {
    return null;
  }

  return (
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
  );
}

export function ContactCardMetadataGrid({
  contact,
  prefs,
  allContacts,
  contactsMap,
  otherColumns,
  visibleColumnIds,
  t,
}: {
  contact: Contact;
  prefs: ContactPreferences;
  allContacts: Contact[];
  contactsMap: Map<string, Contact> | null;
  otherColumns: ContactsColumnConfig[];
  visibleColumnIds: Set<string>;
  t: TranslationFunction;
}) {
  if (otherColumns.length === 0) {
    return null;
  }

  return (
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
          <div
            key={col.id}
            className="flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0"
          >
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
              {colLabel}
            </span>
            <div className="text-xs font-semibold text-foreground truncate mt-0.5">
              <ContactMetadataCell
                colId={col.id}
                contact={contact}
                prefs={prefs}
                allContacts={allContacts}
                contactsMap={contactsMap}
                variant="card"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ContactCardDeletedBanner({
  contact,
  t,
}: {
  contact: Contact;
  t: TranslationFunction;
}) {
  if (!contact.deletedAt) {
    return null;
  }

  return (
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
  );
}
