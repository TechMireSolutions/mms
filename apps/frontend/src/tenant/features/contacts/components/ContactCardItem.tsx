import {
  type Contact,
  type ContactPreferences,
  getDisplayName,
  getPrimaryEmail,
} from "@mms/shared";
import {
  resolveContactPhoneDisplay,
  getContactAccentBarClass,
} from "@/lib/contacts/contactI18n";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { ContactCardActions } from "@/tenant/features/contacts/components/ContactCardActions";
import { ContactCardHeader } from "@/tenant/features/contacts/components/ContactCardHeader";
import {
  ContactCardDeletedBanner,
  ContactCardInfoPills,
  ContactCardMetadataGrid,
} from "@/tenant/features/contacts/components/ContactCardSections";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";

interface ContactCardItemProps {
  contact: Contact;
  isSelected: boolean;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
  otherColumns: ContactsColumnConfig[];
  isColumnVisible: (key: string) => boolean;
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
  otherColumns,
  isColumnVisible,
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
  const reducedMotion = useReducedMotion();
  const displayName = getDisplayName(contact);
  const { phone, countryCode, phoneDisplay } = resolveContactPhoneDisplay(
    contact,
    prefs,
    countryCodesMap,
    countryCodes,
  );
  const email = getPrimaryEmail(contact);

  return (
    <DirectoryEntityCard
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      accentClassName={getContactAccentBarClass(isSelected, contact.gender)}
    >
      <ContactCardHeader
        contact={contact}
        isSelected={isSelected}
        displayName={displayName}
        onSelect={onSelect}
        onView={onView}
        reducedMotion={reducedMotion}
      />

      <ContactCardInfoPills
        phone={phone}
        countryCode={countryCode}
        phoneDisplay={phoneDisplay}
        email={email}
        isColumnVisible={isColumnVisible}
      />

      <ContactCardMetadataGrid
        contact={contact}
        prefs={prefs}
        allContacts={allContacts}
        contactsMap={contactsMap}
        otherColumns={otherColumns}
        isColumnVisible={isColumnVisible}
        t={t}
      />

      <ContactCardDeletedBanner contact={contact} />

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
    </DirectoryEntityCard>
  );
}
