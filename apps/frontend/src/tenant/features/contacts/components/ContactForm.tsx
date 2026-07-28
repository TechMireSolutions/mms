import React, { useState, useCallback, useMemo, useEffect, ChangeEvent } from "react";
import { User, Phone, Mail, MapPin, Share2, Heart } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { getFallbackCountryCode, formatContactPhoneDisplay, resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import {
  useContactConfig,
  useContactValidation,
} from "@/lib/contexts/ContactConfigContext";
import {
  toTitleCase,
  applyTitleCaseToContact,
  getDisplayName,
  Contact,
  todayISO,
  cleanContactDraft,
  normalizeContactForEdit,
  syncContactScalarFields,
  DEFAULT_FORM_TABS,
  type AppTranslationKey,
  type ValidationError,
} from "@mms/shared";

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
  const {
    isTabFieldEnabled,
    fields,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    relationships: relationshipOptions,
    genders,
    countryCodes,
    countryCodesMap,
    prefs,
  } = useContactConfig();
  const validate = useContactValidation();
  const formInstanceId = contact?.id || "new";

  const defaultCountryCode = useMemo(() => {
    return getFallbackCountryCode(prefs, countryCodesMap);
  }, [prefs, countryCodesMap]);

  const countryCodeOptions = useMemo(() => {
    const list = (countryCodes || []).map((countryItem) => countryItem.code).filter(Boolean);
    return Array.from(new Set([defaultCountryCode, ...list]));
  }, [countryCodes, defaultCountryCode]);

  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const getLocalId = useCallback(
    (tabName: string, idx: number): string => `${formInstanceId}-${tabName}-${idx}`,
    [formInstanceId],
  );

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
  );

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setContactDraft(
      normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
    );
    setValidationErrors([]);
  }, [open, contact, initialDraft, defaultCity, defaultProvince, defaultCountry]);

  const collectionCounts = useMemo(() => {
    const filledPhones = (contactDraft.phones || []).filter((p) => (p.number || "").trim()).length;
    const filledEmails = (contactDraft.emails || []).filter((e) => (e.address || "").trim()).length;
    const filledAddresses = (contactDraft.addresses || []).filter((a) => (a.line1 || a.city || "").trim()).length;
    const filledSocials = (contactDraft.socials || []).filter((s) => (s.url || "").trim()).length;
    const filledEmergency = (contactDraft.emergencyContacts || []).filter((e) => e.contactId).length;

    return { filledPhones, filledEmails, filledAddresses, filledSocials, filledEmergency };
  }, [
    contactDraft.phones,
    contactDraft.emails,
    contactDraft.addresses,
    contactDraft.socials,
    contactDraft.emergencyContacts,
  ]);

  const visibleTabs = useMemo(() => {
    const countMap: Record<string, number> = {
      phones: collectionCounts.filledPhones,
      emails: collectionCounts.filledEmails,
      addresses: collectionCounts.filledAddresses,
      socials: collectionCounts.filledSocials,
      emergency: collectionCounts.filledEmergency,
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
  }, [collectionCounts, t]);

  const isFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFields = fields[tabId] || [];
      const exists = tabFields.some((f) => f.key === fieldId);
      if (!exists) return true;
      return isTabFieldEnabled(tabId, fieldId);
    },
    [fields, isTabFieldEnabled],
  );

  const getFieldError = useCallback(
    (fieldId: string) => {
      const found = validationErrors.find(
        (err) => err.fieldId === fieldId && err.index === undefined,
      );
      return found?.message;
    },
    [validationErrors],
  );

  const getListItemError = useCallback(
    (tabId: string, fieldId: string, index: number) => {
      const found = validationErrors.find(
        (err) => err.tabId === tabId && err.fieldId === fieldId && err.index === index,
      );
      return found?.message;
    },
    [validationErrors],
  );

  const updateDraft = useCallback((patch: Partial<Contact>) => {
    setContactDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.firstName !== undefined || patch.lastName !== undefined) {
        const first = next.firstName || "";
        const last = next.lastName || "";
        next.name = [first, last].filter(Boolean).join(" ");
      }
      return next;
    });
  }, []);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (typeof readerEvent.target?.result === "string") {
          setCropSrc(readerEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }
  };

  const handlePhoneBlur = (index: number) => {
    setContactDraft((prev) => {
      const currentPhones = prev.phones || [];
      const phone = currentPhones[index];
      if (!phone || !phone.number) return prev;
      const { countryCode, formattedNumber: number } = formatContactPhoneDisplay(
        phone.number,
        phone.countryCode || defaultCountryCode,
      );
      const updatedPhones = [...currentPhones];
      updatedPhones[index] = { ...phone, countryCode, number };
      return { ...prev, phones: updatedPhones };
    });
  };

  type SubListKey = "phones" | "emails" | "addresses" | "socials" | "emergencyContacts";

  const addSubListItem = useCallback(
    <K extends SubListKey>(fieldKey: K, newItem: NonNullable<Contact[K]>[number]) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[K]>) || [];
        return {
          ...prev,
          [fieldKey]: [...currentList, newItem],
        };
      });
    },
    [],
  );

  const updateSubListItem = useCallback(
    <K extends SubListKey>(
      fieldKey: K,
      idx: number,
      patch: Partial<NonNullable<Contact[K]>[number]>,
    ) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[K]>) || [];
        const nextList = currentList.map((item, i) =>
          i === idx ? { ...item, ...patch } : item,
        );
        return { ...prev, [fieldKey]: nextList };
      });
    },
    [],
  );

  const removeSubListItem = useCallback((fieldKey: SubListKey, idx: number) => {
    setContactDraft((prev) => {
      const currentList = (prev[fieldKey] as unknown[]) || [];
      return {
        ...prev,
        [fieldKey]: currentList.filter((_, i) => i !== idx),
      };
    });
  }, []);

  const handleSave = async (): Promise<void> => {
    setValidationErrors([]);
    const cleanedDraft = cleanContactDraft(contactDraft);
    const formErrors = validate(cleanedDraft);

    if (cleanedDraft.cnic) {
      const cleanCnic = cleanedDraft.cnic.replace(/\D/g, "");
      if (cleanCnic.length > 0 && cleanCnic.length !== 13) {
        formErrors.push({
          fieldId: "cnic",
          tabId: "basic",
          message: t("contacts.form.cnicInvalid"),
        });
      }
    }

    if (formErrors.length > 0) {
      setValidationErrors(formErrors);
      const firstError = formErrors[0];
      if (firstError.tabId) {
        setTab(firstError.tabId as TabKey);
      }
      notify.error(t("contacts.form.pleaseFixErrors"));
      return;
    }

    setSaving(true);
    try {
      const firstName = toTitleCase((cleanedDraft.firstName || "").trim());
      const lastName = toTitleCase((cleanedDraft.lastName || "").trim());

      const normalizedPhones = (cleanedDraft.phones || []).map((phone) => {
        const { countryCode, formattedNumber: number } = formatContactPhoneDisplay(
          phone.number,
          phone.countryCode || defaultCountryCode,
        );
        return { ...phone, countryCode, number };
      });

      const contactRaw: Contact = {
        ...cleanedDraft,
        id: cleanedDraft.id || contact?.id || crypto.randomUUID(),
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" "),
        phones: normalizedPhones,
        updatedAt: todayISO(),
        createdAt: cleanedDraft.createdAt || todayISO(),
      } as Contact;

      const titleCased = applyTitleCaseToContact(contactRaw) as Contact;
      const finalized = syncContactScalarFields(titleCased);

      await onSave(finalized);
      notify.success(
        contact ? t("contacts.form.contactUpdated") : t("contacts.form.contactCreated"),
      );
      onClose();
    } catch (err: unknown) {
      notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderActiveTabContent = () => {
    switch (tab) {
      case "basic":
        return (
          <ContactBasicTab
            contactDraft={contactDraft}
            formInstanceId={String(formInstanceId)}
            isFieldEnabled={isFieldEnabled}
            getFieldError={getFieldError}
            updateDraft={updateDraft}
            cropSrc={cropSrc}
            setCropSrc={setCropSrc}
            genders={genders}
            lockGender={lockGender}
            handleAvatarChange={handleAvatarChange}
          />
        );
      case "phones":
        return (
          <ContactPhonesTab
            contactDraft={contactDraft}
            getLocalId={getLocalId}
            phoneLabels={phoneLabels}
            defaultCountryCode={defaultCountryCode}
            countryCodeOptions={countryCodeOptions}
            getListItemError={getListItemError}
            addSubListItem={addSubListItem}
            updateSubListItem={updateSubListItem}
            removeSubListItem={removeSubListItem}
            handlePhoneBlur={handlePhoneBlur}
          />
        );
      case "emails":
        return (
          <ContactEmailsTab
            contactDraft={contactDraft}
            getLocalId={getLocalId}
            emailLabels={emailLabels}
            getListItemError={getListItemError}
            addSubListItem={addSubListItem}
            updateSubListItem={updateSubListItem}
            removeSubListItem={removeSubListItem}
          />
        );
      case "addresses":
        return (
          <ContactAddressesTab
            contactDraft={contactDraft}
            getLocalId={getLocalId}
            addressLabels={addressLabels}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            defaultCountry={defaultCountry}
            getListItemError={getListItemError}
            addSubListItem={addSubListItem}
            updateSubListItem={updateSubListItem}
            removeSubListItem={removeSubListItem}
          />
        );
      case "socials":
        return (
          <ContactSocialsTab
            contactDraft={contactDraft}
            getLocalId={getLocalId}
            socialPlatforms={socialPlatforms}
            getListItemError={getListItemError}
            addSubListItem={addSubListItem}
            updateSubListItem={updateSubListItem}
            removeSubListItem={removeSubListItem}
          />
        );
      case "emergency":
        return (
          <ContactEmergencyTab
            contactDraft={contactDraft}
            getLocalId={getLocalId}
            relationshipOptions={relationshipOptions}
            getListItemError={getListItemError}
            addSubListItem={addSubListItem}
            updateSubListItem={updateSubListItem}
            removeSubListItem={removeSubListItem}
          />
        );
      default:
        return null;
    }
  };

  const footerStart = contactDraft.firstName ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {getDisplayName(contactDraft)}
      </span>
      <div className="flex items-center gap-1.5">
        {collectionCounts.filledPhones > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
            {collectionCounts.filledPhones} {t("contacts.form.phonesLabel")}
          </span>
        )}
        {collectionCounts.filledEmails > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-warning/10 text-warning font-semibold border border-warning/20 text-[10px]">
            {collectionCounts.filledEmails} {t("contacts.form.emailsLabel")}
          </span>
        )}
        {collectionCounts.filledEmergency > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20 text-[10px]">
            {collectionCounts.filledEmergency} {t("contacts.detail.emergency")}
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
        void handleSave();
      }}
      saving={saving}
      saveDisabled={!contactDraft.firstName?.trim()}
      footerStart={footerStart}
    >
      {renderActiveTabContent()}
    </FormModal>
  );
}
