import { type Contact, type ContactPreferences } from "@mms/shared";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import type { useTranslation } from "@/hooks/useTranslation";
import {
  columnWidthStyle,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/contactTableTypes";
import {
  renderContactEmailCell,
  renderContactNameCell,
  renderContactPhoneCell,
} from "@/tenant/features/contacts/components/contactTablePrimaryCells";

type Translate = ReturnType<typeof useTranslation>["t"];

export function renderContactTableCell({
  col,
  contact,
  displayName,
  getColumnWidth,
  prefs,
  countryCodesMap,
  countryCodes,
  contactsMap,
  allContacts,
  showArchived,
  isSelected,
  t,
  onView,
  onWhatsApp,
}: {
  col: ContactsColumnConfig;
  contact: Contact;
  displayName: string;
  getColumnWidth: (key: string) => number | undefined;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
  showArchived: boolean;
  isSelected: boolean;
  t: Translate;
  onView?: (contact: Contact) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const width = getColumnWidth(col.id) ?? col.width;
  const widthStyle = columnWidthStyle(width);

  switch (col.id) {
    case "name":
      return renderContactNameCell({
        contact,
        displayName,
        widthStyle,
        showArchived,
        isSelected,
        t,
        onView,
      });
    case "phone":
      return renderContactPhoneCell({
        contact,
        prefs,
        countryCodesMap,
        countryCodes,
        widthStyle,
        t,
        onWhatsApp,
      });
    case "email":
      return renderContactEmailCell({ contact, widthStyle, t });
    default:
      return (
        <ContactMetadataCell
          key={col.id}
          colId={col.id}
          contact={contact}
          prefs={prefs}
          allContacts={allContacts}
          contactsMap={contactsMap}
          variant="table"
          style={widthStyle}
        />
      );
  }
}
