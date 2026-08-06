import type { JSX } from "react";
import { Archive } from "lucide-react";
import {
  formatDate,
  isRelationshipContactColumnKey,
  isRelationshipTypeColumnKey,
  isRelationshipWorkColumnKey,
  type Contact,
  type ContactPreferences,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";

export function ContactCardMetadataGrid({
  contact,
  prefs,
  allContacts,
  contactsMap,
  otherColumns,
  isColumnVisible,
  t,
}: {
  contact: Contact;
  prefs: ContactPreferences;
  allContacts: Contact[];
  contactsMap: Map<string, Contact> | null;
  otherColumns: ContactsColumnConfig[];
  isColumnVisible: (key: string) => boolean;
  t: TranslationFunction;
}): JSX.Element | null {
  if (otherColumns.length === 0) {
    return null;
  }

  const hasVisibleRelationshipContact = otherColumns.some((col) =>
    isRelationshipContactColumnKey(col.id) && isColumnVisible(col.id),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
      {otherColumns.map((col) => {
        if (col.id === "socials_url" && isColumnVisible("socials_platform")) {
          return null;
        }
        if (isRelationshipTypeColumnKey(col.id) && hasVisibleRelationshipContact) {
          return null;
        }
        if (!hasContactCardColumnData(contact, col.id)) return null;

        const colLabel =
          col.id === "socials_platform" || col.id === "socials_url"
            ? t("contacts.detail.socials")
            : isRelationshipWorkColumnKey(col.id)
              ? t("contacts.form.tabRelationship")
              : col.label;

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
}): JSX.Element | null {
  if (!contact.deletedAt) {
    return null;
  }

  return (
    <WarningCallout
      icon={Archive}
      density="compact"
      role="status"
      title={t("contacts.table.deletedAt", { date: formatDate(contact.deletedAt) })}
      description={
        contact.deletionReason
          ? `${t("contacts.deletionReasonLabel")}: ${contact.deletionReason}`
          : undefined
      }
    />
  );
}
