import type React from "react";
import { useState, useMemo, useEffect, type ComponentType } from "react";
import { User, Phone, Mail, MapPin, Share2, GraduationCap, Briefcase, Award, Heart, Sparkles, FolderKanban } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { type Contact, DEFAULT_FORM_TABS } from "@mms/shared";
import { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { ContactFormTabContent } from "@/tenant/features/contacts/components/ContactFormTabContent";
import { ContactFormFooterStart } from "@/tenant/features/contacts/components/ContactFormFooterStart";

export interface ContactFormProps {
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
  custom: Sparkles,
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
}: ContactFormProps): React.JSX.Element {
  const { t, dir } = useTranslation();
  const { language } = useGlobalSettings();
  const { enabledTabIds } = useContactConfig();
  const [tab, setTab] = useState("basic");
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

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
    setConfirmDiscardOpen(false);
  }, [open]);

  const handleRequestClose = () => {
    if (draft.isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const canSave =
          Boolean(draft.contactDraft.firstName?.trim()) &&
          (!contact || draft.isDirty) &&
          !draft.saving;
        if (canSave) {
          draft.handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, draft, contact]);

  const tabErrorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!draft.validationErrors || draft.validationErrors.length === 0) return counts;
    for (const err of draft.validationErrors) {
      const tabId = err.tabId || "basic";
      counts[tabId] = (counts[tabId] || 0) + 1;
    }
    return counts;
  }, [draft.validationErrors]);

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
      ...draft.collectionCounts,
    };

    // System tabs from shared SSOT (DEFAULT_FORM_TABS) filtered by enabledTabIds (with basic locked on)
    const baseTabs = DEFAULT_FORM_TABS;

    return baseTabs
      .filter((sys) => enabledTabIds.has(sys.key))
      .map((sys) => {
        const count = countMap[sys.key];
        const errorCount = tabErrorCounts[sys.key];
        const hasErrors = Boolean(errorCount && errorCount > 0);
        const label = sys.labelKey ? t(sys.labelKey) : (sys.label || sys.key);
        return {
          key: sys.key,
          icon: SYSTEM_TAB_ICONS[sys.key] ?? FolderKanban,
          label,
          badge: hasErrors ? errorCount : count && count > 0 ? count : undefined,
          tone: hasErrors ? ("destructive" as const) : undefined,
        };
      });
  }, [draft.collectionCounts, tabErrorCounts, t, enabledTabIds]);

  useEffect(() => {
    if (!visibleTabs.some((tabItem) => tabItem.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "basic");
    }
  }, [tab, visibleTabs]);

  const validationErrorSummary = useMemo(() => {
    if (draft.lookupsError) return t("contacts.form.lookupsLoadFailed");
    if (!draft.validationErrors || draft.validationErrors.length === 0) return undefined;
    const messages = draft.validationErrors
      .map((err) => err.message)
      .filter((msg): msg is string => Boolean(msg));
    return messages.length > 0 ? Array.from(new Set(messages)) : undefined;
  }, [draft.lookupsError, draft.validationErrors, t]);

  return (
    <>
      <FormModal
        open={open}
        onClose={handleRequestClose}
        title={contact ? t("contacts.form.editTitle") : t("contacts.form.addTitle")}
        subtitle={
          contact
            ? t("contacts.form.editing", { name: contact.name || "" })
            : t("contacts.form.createNewContact")
        }
        icon={User}
        tall
        priority={priority}
        error={validationErrorSummary}
        tabs={visibleTabs}
        activeTab={tab}
        onTabChange={setTab}
        tabPanelIdPrefix="contact-form-tab"
        lang={language}
        dir={dir}
        cancelLabel={t("common.cancel")}
        saveLabel={t("contacts.form.saveContact")}
        onSave={draft.handleSave}
        isDirty={draft.isDirty}
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

      <ConfirmAlertDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
        title={t("contacts.form.discardUnsavedTitle")}
        description={t("contacts.form.discardUnsavedDescription")}
        confirmLabel={t("contacts.form.discardChanges")}
        cancelLabel={t("contacts.form.keepEditing")}
        destructive
        onConfirm={() => {
          onClose();
        }}
      />
    </>
  );
}

export default ContactForm;
