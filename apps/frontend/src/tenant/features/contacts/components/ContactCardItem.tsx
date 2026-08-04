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
      className={`relative overflow-hidden group rounded-2xl border bg-gradient-to-br from-card/95 via-card/85 to-background/70 dark:from-card/95 dark:via-card/80 dark:to-background/60 backdrop-blur-xl p-4 ps-5.5 space-y-4 shadow-xs ${reducedMotion ? "" : "transition-all duration-300 hover:shadow-md"} ${isSelected
        ? "border-primary/50 bg-primary/[0.025] dark:bg-primary/[0.03] shadow-xs shadow-primary/5"
        : "border-border/50 dark:border-border/30 hover:border-primary/35 dark:hover:border-primary/20"
      }`}
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
