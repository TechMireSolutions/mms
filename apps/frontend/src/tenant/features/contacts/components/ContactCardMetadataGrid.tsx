import { AlertTriangle } from "lucide-react";
import { formatDate, type Contact, type ContactPreferences } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";

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
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
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
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1 text-xs text-destructive text-start">
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
