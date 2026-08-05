import { motion } from "framer-motion";
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
import { FORM_CARD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
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

export { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";

export const contactCardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

const contactCardItemVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

export interface ContactCardItemProps {
  contact: Contact;
  isSelected: boolean;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
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
  const reducedMotion = useReducedMotion();
  const displayName = getDisplayName(contact);
  const { phone, countryCode, phoneDisplay } = resolveContactPhoneDisplay(
    contact,
    prefs,
    countryCodesMap,
    countryCodes,
  );
  const email = getPrimaryEmail(contact);
  const showPhonePill = visibleColumnIds.size === 0 || visibleColumnIds.has("phone");
  const showEmailPill = visibleColumnIds.size === 0 || visibleColumnIds.has("email");

  return (
    <motion.div
      layout={!reducedMotion}
      variants={reducedMotion ? contactCardItemVariantsReduced : contactCardItemVariants}
      whileHover={
        reducedMotion
          ? undefined
          : { y: -4, scale: 1.01, transition: { duration: 0.2 } }
      }
      role="region"
      aria-label={displayName}
      className={cn(
        FORM_CARD,
        "p-4 ps-5.5 space-y-4 shadow-xs",
        reducedMotion ? "hover:shadow-none" : "hover:shadow-md",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-xs shadow-primary/5"
          : "border-border/50 hover:border-primary/35",
      )}
    >
      <div
        aria-hidden="true"
        className={`absolute start-0 top-0 bottom-0 w-1.5 ${getContactAccentBarClass(isSelected, contact.gender)} ${reducedMotion ? "" : "transition-colors duration-300"}`}
      />

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
        showPhonePill={showPhonePill}
        showEmailPill={showEmailPill}
      />

      <ContactCardMetadataGrid
        contact={contact}
        prefs={prefs}
        allContacts={allContacts}
        contactsMap={contactsMap}
        otherColumns={otherColumns}
        visibleColumnIds={visibleColumnIds}
        t={t}
      />

      <ContactCardDeletedBanner contact={contact} t={t} />

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
