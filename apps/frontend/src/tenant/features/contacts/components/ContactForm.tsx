import { useState, useMemo, useEffect, type ComponentType } from "react";
import { User, Phone, Mail, MapPin, Share2, Heart, SlidersHorizontal } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { type Contact, DEFAULT_FORM_TABS, mergeDfsTabs } from "@mms/shared";
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

/**
 * Icon map for the six system form tabs. The tab definitions (key, labelKey,
 * order) come from the shared `DEFAULT_FORM_TABS` SSOT in `@mms/shared`
 * (`contactTabRegistry.ts`); only the Lucide icon components are local because
 * `TabDefinition.icon` is an optional string name, not a component reference.
 */
const SYSTEM_TAB_ICONS: Record<string, ComponentType> = {
  basic: User,
  phones: Phone,
  emails: Mail,
  addresses: MapPin,
  socials: Share2,
  relationship: Heart,
};

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
  const [tab, setTab] = useState("basic");
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
    onValidationTab: (tabId, fieldId) => {
      setTab(tabId);
      if (!fieldId) return;
      const targetId = `cf-${formInstanceId}-${fieldId}`;
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

    // System tabs from shared SSOT (DEFAULT_FORM_TABS) — always shown; "basic" is mandatory
    const resolved: Array<{ key: string; icon: ComponentType; label: string; badge: number | undefined }> = DEFAULT_FORM_TABS.map((sys) => {
      const count = countMap[sys.key];
      return {
        key: sys.key,
        icon: SYSTEM_TAB_ICONS[sys.key] ?? User,
        label: t(sys.labelKey!),
        badge: count && count > 0 ? count : undefined,
      };
    });

    // DFS-managed custom tabs — appended via shared helper
    return mergeDfsTabs(
      resolved,
      draft.dfsTabs,
      (dfsTab) => ({
        key: dfsTab.key,
        icon: SlidersHorizontal as ComponentType,
        label: dfsTab.label,
        badge: undefined,
      }),
    );
  }, [draft.collectionCounts, draft.dfsTabs, t]);

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
