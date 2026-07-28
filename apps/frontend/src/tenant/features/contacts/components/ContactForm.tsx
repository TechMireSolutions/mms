import React, { useState, useMemo, useEffect } from "react";
import { User, Phone, Mail, MapPin, Share2, Heart } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import {
  Contact,
  DEFAULT_FORM_TABS,
  type AppTranslationKey,
} from "@mms/shared";
import { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import {
  ContactFormTabContent,
  ContactFormFooterStart,
} from "@/tenant/features/contacts/components/ContactFormTabContent";

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

const CONTACT_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  phones: Phone,
  emails: Mail,
  addresses: MapPin,
  socials: Share2,
  emergency: Heart,
};

const CONTACT_TABS = DEFAULT_FORM_TABS
  .slice()
  .sort((left, right) => left.order - right.order)
  .flatMap((tab) => {
    const icon = CONTACT_TAB_ICONS[tab.key];
    if (!icon) return [];
    return [{
      key: tab.key,
      labelKey: tab.labelKey ?? ("contacts.form.tabBasic" as AppTranslationKey),
      icon,
      label: tab.label,
    }];
  });

type TabKey = (typeof CONTACT_TABS)[number]["key"];

export default function ContactForm({
  open = true,
  contact,
  onClose,
  onSave,
  defaultCountry = "",
  defaultCity = "",
  defaultProvince = "",
  initialDraft,
  lockGender = false,
  priority = false,
}: ContactFormProps): JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const [tab, setTab] = useState<TabKey>("basic");

  const draft = useContactFormDraft({
    open,
    contact,
    initialDraft,
    defaultCountry,
    defaultCity,
    defaultProvince,
    onSave,
    onClose,
    onValidationTab: (tabId) => setTab(tabId as TabKey),
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
      socials: draft.collectionCounts.filledSocials,
      emergency: draft.collectionCounts.filledEmergency,
    };

    return CONTACT_TABS.map((tabItem) => {
      const count = countMap[tabItem.key];
      return {
        key: tabItem.key,
        icon: tabItem.icon,
        label: resolveRegistryLabel(tabItem, t),
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
      tabs={visibleTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="contact-form-tab"
      lang={language}
      cancelLabel={t("common.cancel")}
      saveLabel={t("contacts.form.saveContact")}
      onSave={() => {
        void draft.handleSave();
      }}
      saving={draft.saving}
      saveDisabled={!draft.contactDraft.firstName?.trim()}
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
