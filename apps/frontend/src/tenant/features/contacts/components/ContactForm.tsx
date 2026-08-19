import { useState, useMemo, useEffect, type ComponentType } from "react";
import { User, Phone, Mail, MapPin, Share2, GraduationCap, Briefcase, Award, Heart } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { type Contact, DEFAULT_FORM_TABS } from "@mms/shared";
import { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import { ContactFormTabContent } from "@/tenant/features/contacts/components/ContactFormTabContent";
import { ContactFormFooterStart } from "@/tenant/features/contacts/components/ContactFormFooterStart";

interface ContactFormProps {
  open?: boolean;
  contact?: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void | Promise<void>;
  defaultCountry?: string;
  defaultCity?: string;
  defaultProvince?: string;
  initialDraft?: Partial<Contact>;
  lockGender?: boolean;
  /** Raise above other modals (e.g. create from ContactPicker inside a form). */
  priority?: boolean;
}

/**
 * Icon map for the system form tabs. The tab definitions (key, labelKey,
 * order) come from the shared `DEFAULT_FORM_TABS` SSOT in `@mms/shared`
 * (`contactTabRegistry.ts`); only the Lucide icon components are local because
 * Lucide React icons are a frontend concern.
 */
const SYSTEM_TAB_ICONS: Record<string, ComponentType> = {
  basic: User,
  phones: Phone,
  emails: Mail,
  addresses: MapPin,
  social: Share2,
  socials: Share2,
  education: GraduationCap,
  experience: Briefcase,
  skills: Award,
  relationship: Heart,
};
export function ContactForm({
  open = true,
  contact,
  onClose,
  onSave,
  defaultCountry = "Pakistan",
  defaultCity = "Karachi",
  defaultProvince = "Sindh",
  initialDraft,
  lockGender = false,
  priority = false,
}: ContactFormProps) {
  const { t, dir } = useTranslation();
  const { language } = useGlobalSettings();
  const [tab, setTab] = useState("basic");

  const draft = useContactFormDraft({
    open,
    contact,
    initialDraft,
    defaultCountry,
    defaultCity,
    defaultProvince,
    onSave,
    onClose,
    onValidationTab: (tabId) => setTab(tabId),
  });

  useEffect(() => {
    if (!open) return;
    setTab("basic");
  }, [open, contact, initialDraft]);

  const visibleTabs = useMemo(() => {
    const countMap: Record<string, number> = {
      phones: draft.collectionCounts.filledPhones,
      emails: draft.collectionCounts.filledEmails,
      addresses: draft.collectionCounts.filledAddresses,
      social: draft.collectionCounts.filledSocials,
      socials: draft.collectionCounts.filledSocials,
      education: draft.collectionCounts.filledEducation,
      experience: draft.collectionCounts.filledExperience,
      skills: draft.collectionCounts.filledSkills,
      relationship: draft.collectionCounts.filledRelationships,
    };

    // System tabs from shared SSOT (DEFAULT_FORM_TABS) — always shown; "basic" is mandatory
    return DEFAULT_FORM_TABS.map((sys) => {
      const count = countMap[sys.key];
      return {
        key: sys.key,
        icon: SYSTEM_TAB_ICONS[sys.key] ?? User,
        label: t(sys.labelKey!),
        badge: count && count > 0 ? count : undefined,
      };
    });
  }, [draft.collectionCounts, t]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={contact ? t("contacts.form.editTitle") : t("contacts.form.addTitle")}
      subtitle={
        contact
          ? t("contacts.form.editing", { name: contact.name || "" })
          : t("contacts.form.createNewContact")
      }
      icon={User}
      tall
      priority={priority}
      error={draft.lookupsError ? t("contacts.form.lookupsLoadFailed") : undefined}
      tabs={visibleTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="contact-form-tab"
      lang={language}
      dir={dir}
      cancelLabel={t("common.cancel")}
      saveLabel={t("contacts.form.saveContact")}
      onSave={() => {
        void draft.handleSave();
      }}
      saving={draft.saving}
      saveDisabled={
        !draft.contactDraft.firstName?.trim() || (Boolean(contact) && !draft.isDirty)
      }
      footerStart={
        <ContactFormFooterStart
          contactDraft={draft.contactDraft}
          collectionCounts={draft.collectionCounts}
          t={t}
        />
      }
    >
      <ContactFormTabContent
        tab={tab}
        draft={draft}
        lockGender={lockGender}
        defaultCountry={defaultCountry}
        defaultCity={defaultCity}
        defaultProvince={defaultProvince}
      />
    </FormModal>
  );
}

export default ContactForm;
