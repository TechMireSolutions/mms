import type { JSX } from "react";
import {
  isRelationshipContactColumnKey,
  isRelationshipTypeColumnKey,
  isRelationshipWorkColumnKey,
  type Contact,
  type ContactPreferences,
} from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { ContactArchivedBanner } from "@/tenant/features/contacts/components/ContactArchivedBanner";
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
    <DirectoryCardMetadata
      columns={otherColumns}
      keyFor={(col) => col.id}
      labelFor={(col) =>
        col.id === "socials_platform" || col.id === "socials_url"
          ? t("contacts.detail.socials")
          : isRelationshipWorkColumnKey(col.id)
            ? t("contacts.form.tabRelationship")
            : col.label
      }
      renderValue={(col) => {
        if (col.id === "socials_url" && isColumnVisible("socials_platform")) {
          return null;
        }
        if (isRelationshipTypeColumnKey(col.id) && hasVisibleRelationshipContact) {
          return null;
        }
        if (!hasContactCardColumnData(contact, col.id)) return null;

        return (
          <ContactMetadataCell
            colId={col.id}
            contact={contact}
            prefs={prefs}
            allContacts={allContacts}
            contactsMap={contactsMap}
            variant="card"
          />
        );
      }}
    />
  );
}

export function ContactCardDeletedBanner({
  contact,
}: {
  contact: Contact;
}): JSX.Element | null {
  return <ContactArchivedBanner contact={contact} />;
}
