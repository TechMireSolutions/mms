import React, { useState, useMemo, useEffect } from "react";
import { User, Phone, Mail, MapPin, Share2, Heart } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import {
  getDisplayName,
  Contact,
  DEFAULT_FORM_TABS,
  type AppTranslationKey,
} from "@mms/shared";
import { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";

import { ContactBasicTab } from "./formTabs/ContactBasicTab";
import { ContactPhonesTab } from "./formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "./formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "./formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "./formTabs/ContactSocialsTab";
import { ContactEmergencyTab } from "./formTabs/ContactEmergencyTab";

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

  const renderActiveTabContent = () => {
    switch (tab) {
      case "basic":
        return (
          <ContactBasicTab
            contactDraft={draft.contactDraft}
            formInstanceId={String(draft.formInstanceId)}
            isFieldEnabled={draft.isFieldEnabled}
            getFieldError={draft.getFieldError}
            updateDraft={draft.updateDraft}
            cropSrc={draft.cropSrc}
            setCropSrc={draft.setCropSrc}
            genders={draft.genders}
            lockGender={lockGender}
            handleAvatarChange={draft.handleAvatarChange}
          />
        );
      case "phones":
        return (
          <ContactPhonesTab
            contactDraft={draft.contactDraft}
            getLocalId={draft.getLocalId}
            phoneLabels={draft.phoneLabels}
            defaultCountryCode={draft.defaultCountryCode}
            countryCodeOptions={draft.countryCodeOptions}
            getListItemError={draft.getListItemError}
            addSubListItem={draft.addSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
            handlePhoneBlur={draft.handlePhoneBlur}
          />
        );
      case "emails":
        return (
          <ContactEmailsTab
            contactDraft={draft.contactDraft}
            getLocalId={draft.getLocalId}
            emailLabels={draft.emailLabels}
            getListItemError={draft.getListItemError}
            addSubListItem={draft.addSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
          />
        );
      case "addresses":
        return (
          <ContactAddressesTab
            contactDraft={draft.contactDraft}
            getLocalId={draft.getLocalId}
            addressLabels={draft.addressLabels}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            defaultCountry={defaultCountry}
            getListItemError={draft.getListItemError}
            addSubListItem={draft.addSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
          />
        );
      case "socials":
        return (
          <ContactSocialsTab
            contactDraft={draft.contactDraft}
            getLocalId={draft.getLocalId}
            socialPlatforms={draft.socialPlatforms}
            getListItemError={draft.getListItemError}
            addSubListItem={draft.addSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
          />
        );
      case "emergency":
        return (
          <ContactEmergencyTab
            contactDraft={draft.contactDraft}
            getLocalId={draft.getLocalId}
            relationshipOptions={draft.relationshipOptions}
            getListItemError={draft.getListItemError}
            addSubListItem={draft.addSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
          />
        );
      default:
        return null;
    }
  };

  const footerStart = draft.contactDraft.firstName ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {getDisplayName(draft.contactDraft)}
      </span>
      <div className="flex items-center gap-1.5">
        {draft.collectionCounts.filledPhones > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
            {draft.collectionCounts.filledPhones} {t("contacts.form.phonesLabel")}
          </span>
        )}
        {draft.collectionCounts.filledEmails > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-warning/10 text-warning font-semibold border border-warning/20 text-[10px]">
            {draft.collectionCounts.filledEmails} {t("contacts.form.emailsLabel")}
          </span>
        )}
        {draft.collectionCounts.filledEmergency > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20 text-[10px]">
            {draft.collectionCounts.filledEmergency} {t("contacts.detail.emergency")}
          </span>
        )}
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      {t("contacts.form.firstNameRequired")}
    </span>
  );

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
      footerStart={footerStart}
    >
      {renderActiveTabContent()}
    </FormModal>
  );
}
