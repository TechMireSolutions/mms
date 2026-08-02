import React, { useState, useMemo, useEffect } from "react";
import { User } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import {
  isContactCustomCollectionTab,
  listEnabledCustomContactFormFields,
  type Contact,
} from "@mms/shared";
import { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import {
  ContactFormTabContent,
  ContactFormFooterStart,
} from "@/tenant/features/contacts/components/ContactFormTabContent";
import { resolveContactFormTabs } from "@/tenant/features/contacts/components/contactFormTabs";

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
  const { t, dir } = useTranslation();
  const { language } = useGlobalSettings();
  const { enabledTabIds, fields, fieldConfig } = useContactConfig();
  const [tab, setTab] = useState("basic");
  const hasCustomFields = listEnabledCustomContactFormFields(fields, "custom").length > 0;
  const formTabs = resolveContactFormTabs(fieldConfig.formTabs);
  const formInstanceId = String(contact?.id ?? "new");

  const draft = useContactFormDraft({
    open,
    contact,
    initialDraft,
    defaultCountry,
    defaultCity,
    defaultProvince,
    onSave,
    onClose,
    onValidationTab: (tabId, fieldId, index) => {
      setTab(tabId);
      if (!fieldId) return;
      const targetId =
        typeof index === "number" && isContactCustomCollectionTab(tabId)
          ? `cf-${formInstanceId}-${tabId}-${index}-${fieldId}`
          : `cf-${formInstanceId}-${fieldId}`;
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target instanceof HTMLElement) target.focus();
      });
    },
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
      relationship: draft.collectionCounts.filledRelationships,
    };

    return formTabs.filter((tabItem) => {
      if (tabItem.key === "basic") return true;
      if (tabItem.key === "custom") return hasCustomFields;
      return enabledTabIds.has(tabItem.key);
    }).map((tabItem) => {
      const count = countMap[tabItem.key];
      return {
        key: tabItem.key,
        icon: tabItem.icon,
        label: resolveRegistryLabel(tabItem, t),
        badge: count && count > 0 ? count : undefined,
      };
    });
  }, [draft.collectionCounts, enabledTabIds, formTabs, hasCustomFields, t]);

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
      dir={dir}
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
