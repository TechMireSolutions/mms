import React, { useState, useMemo, useCallback, useRef, useTransition, useEffect } from "react";
import { useMmsForm } from "@/hooks/useMmsForm";
import ContactsSetupPanel from "./ContactsSetupPanel";
import { Phone, Mail, MapPin, Share2, User, Heart, LucideIcon } from "lucide-react";
import { notify } from "@/lib/notify";
import { MmsDynamicForm } from "@/components/ui/MmsDynamicForm";
import { useContactConfig, calculateProfileCompleteness } from '@/lib/contexts/ContactConfigContext';
import {
  toTitleCase,
  applyTitleCaseToContact,
  normalizeToE164,
  parsePhoneNumber,
  Contact,
  canViewContactTab,
  canViewContactField,
  CONTACTS_MODULE_CONTRACT,
  buildDynamicContactSchema,
  isRtlLanguage,
  type ValidationError,
  type PhoneNumber,
  type EmergencyContact,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { usePermissions } from '@/hooks/usePermissions';
import { apiJson } from "@/lib/apiClient";
import { useReadOnlyContactFieldKeys } from '@/hooks/useVisibleContactFields';
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import BasicTab     from "./form/BasicTab";
import PhoneTab     from "./form/PhoneTab";
import EmailTab     from "./form/EmailTab";
import AddressTab   from "./form/AddressTab";
import SocialTab    from "./form/SocialTab";
import EmergencyTab from "./form/EmergencyTab";
import RelationshipsTab from "./form/RelationshipsTab";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
const ICON_MAP: Record<string, LucideIcon> = {
  User, Phone, Mail, MapPin, Share2, Heart
};

const TAB_DATA_KEY: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
  relationships: "relationships",
};
interface TabRenderProps {
  data: Partial<Contact>;
  onChange: (d: Partial<Contact>) => void;
  requiredTabIds: Set<string>;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  readOnlyFieldKeys?: string[];
  errors?: ValidationError[];
}

const SYSTEM_TAB_RENDERS: Record<
  string,
  (props: TabRenderProps) => React.JSX.Element
> = {
  basic: ({ data, onChange, readOnlyFieldKeys, errors }) => (
    <BasicTab tabId="basic" data={data} onChange={onChange} readOnlyFieldKeys={readOnlyFieldKeys} errors={errors} />
  ),
  phones: ({ data, onChange, requiredTabIds, defaultCountry, errors }) => (
    <PhoneTab
      data={data}
      onChange={onChange}
      required={requiredTabIds.has("phones")}
      defaultCountry={defaultCountry}
      errors={errors}
    />
  ),
  emails: ({ data, onChange, requiredTabIds, errors }) => (
    <EmailTab
      data={data}
      onChange={onChange}
      required={requiredTabIds.has("emails")}
      errors={errors}
    />
  ),
  addresses: ({ data, onChange, requiredTabIds, defaultCountry, defaultCity, defaultProvince, errors }) => (
    <AddressTab
      data={data}
      onChange={onChange}
      required={requiredTabIds.has("addresses")}
      defaultCountry={defaultCountry}
      defaultCity={defaultCity}
      defaultProvince={defaultProvince}
      errors={errors}
    />
  ),
  socials: ({ data, onChange, requiredTabIds, errors }) => (
    <SocialTab
      data={data}
      onChange={onChange}
      required={requiredTabIds.has("socials")}
      errors={errors}
    />
  ),
  emergency: ({ data, onChange, requiredTabIds, errors }) => (
    <EmergencyTab
      data={data}
      onChange={onChange}
      required={requiredTabIds.has("emergency")}
      errors={errors}
    />
  ),
  relationships: ({ data, onChange, errors }) => (
    <RelationshipsTab
      data={data}
      onChange={onChange}
      errors={errors}
    />
  ),
};

interface ContactFormProps {
  open?: boolean;
  contact?: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  defaultCountry?: string;
  defaultCity?: string;
  defaultProvince?: string;
  /** Prefill for new contacts (e.g. name from ContactPicker search). */
  initialDraft?: Partial<Contact>;
  /** When true, gender cannot be changed (e.g. father/mother pickers). */
  lockGender?: boolean;
}
/**
 * ContactForm component for creating or editing contact records.
 *
 * @param props - Component props.
 * @param props.contact - The contact object to edit, or undefined for a new contact.
 * @param props.onClose - Callback to close the form dialog.
 * @param props.onSave - Callback to save/create the contact.
 * @param props.defaultCountry - Default fallback country.
 * @param props.defaultCity - Default fallback city.
 * @param props.defaultProvince - Default fallback province.
 * @returns React.JSX.Element
 */
export default function ContactForm({
  open = true,
  contact,
  onClose,
  onSave,
  defaultCountry: defaultCountryProp = "",
  defaultCity: defaultCityProp = "",
  defaultProvince: defaultProvinceProp = "",
  initialDraft,
  lockGender = false,
}: ContactFormProps): React.JSX.Element {
  const { fieldConfig, prefs, enabledTabIds, requiredTabIds, fields, countryCodesMap, lifecycleStages, defaultContactRating, defaultPhoneCountryCode, updateConfig } = useContactConfig();
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { role, can } = usePermissions();
  const viewerRole = role ?? '';
  const canEditSetup = can(CONTACTS_MODULE_CONTRACT.permissions.setupWrite);

  const queryClient = useQueryClient();
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [, startTransition] = useTransition();

  // Construct initial values conforming to Rule 12 for crash-free dynamic rendering
  const initialValues = useMemo<Partial<Contact>>(() => {
    const initial: Record<string, unknown> = {
      name: "",
      lifecycleStage: lifecycleStages[0] || "",
      rating: defaultContactRating,
      avatar: null,
      phones: [],
      emails: [],
      addresses: [],
      socials: [],
      emergencyContacts: [],
      relationships: [],
      activities: [],
    };

    const draft = queryClient.getQueryData<Partial<Contact>>(['builder_draft', 'contact', contact?.id || 'new']);
    const target = draft || contact || initialDraft || {};
    const merged = {
      ...initial,
      ...target,
    };

    if (!merged.lifecycleStage) {
      merged.lifecycleStage = lifecycleStages[0] || "";
    }
    if (typeof merged.rating !== "number") {
      merged.rating = defaultContactRating;
    }

    const defaultCode = countryCodesMap[defaultCountryProp] || defaultPhoneCountryCode;
    const phones = ((merged.phones as PhoneNumber[] | undefined) || []).map((p) => {
      if (p.countryCode) return p;
      const parsed = parsePhoneNumber(p.number || "", defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    });

    const emergencyContacts = ((merged.emergencyContacts as EmergencyContact[] | undefined) || []).map((ec) => ({
      ...ec,
      contactId: ec.contactId == null || ec.contactId === "" ? "" : String(ec.contactId),
    }));

    return {
      ...merged,
      phones,
      emergencyContacts,
    } as Partial<Contact>;
  }, [contact, initialDraft, queryClient, countryCodesMap, defaultCountryProp, defaultPhoneCountryCode, lifecycleStages, defaultContactRating]);

  // Set up React Hook Form with dynamic validation schema
  const schema = useMemo(() => {
    return buildDynamicContactSchema(
      fieldConfig,
      enabledTabIds,
      requiredTabIds,
      fields,
      language,
      viewerRole
    );
  }, [fieldConfig, enabledTabIds, requiredTabIds, fields, language, viewerRole]);

  const {
    form,
    tab,
    setTab,
    saving,
    setSaving,
    errors,
    handleSave,
  } = useMmsForm<Contact>({
    schema,
    fields,
    initialData: initialValues,
    t,
  });

  const data = form.watch();
  const setValue = form.setValue;

  const handleToggleBuilderMode = useCallback((active: boolean) => {
    if (active) {
      queryClient.setQueryData(['builder_draft', 'contact', contact?.id || 'new'], form.getValues());
    }
    startTransition(() => {
      setIsBuilderMode(active);
    });
  }, [queryClient, contact?.id, form]);

  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const pendingSaveRef = useRef<Contact | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [typedDuplicateCount, setTypedDuplicateCount] = useState<number>(0);

  // Unified helper for formatting, normalizing, and applying title case to a Contact record
  const prepareContactData = useCallback((formData: Partial<Contact>, isSubmit = false): Contact => {
    const firstName = toTitleCase(formData.firstName?.trim() || "") as string;
    const lastName  = toTitleCase(formData.lastName?.trim() || "") as string;
    
    const defaultCode = countryCodesMap[defaultCountryProp] || defaultPhoneCountryCode;
    const normalizedPhones = (formData.phones || []).map((p) => {
      const e164 = normalizeToE164(p.countryCode || defaultCode, p.number);
      const parsed = parsePhoneNumber(e164, p.countryCode || defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    });

    const contactRaw: Contact = {
      ...formData,
      id: formData.id || contact?.id || (isSubmit ? crypto.randomUUID() : ""),
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(" "),
      phones: normalizedPhones,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: formData.createdAt || new Date().toISOString().slice(0, 10),
      _blueprintId: String(fieldConfig.version),
    } as Contact;

    return applyTitleCaseToContact(contactRaw) as Contact;
  }, [countryCodesMap, defaultCountryProp, defaultPhoneCountryCode, contact?.id, fieldConfig.version]);

  // Background duplicate check while typing (Rule 12.1)
  const identityString = useMemo(() => {
    const phonesStr = (data.phones || []).map((p) => `${p.countryCode || ""}:${p.number || ""}`).join(",");
    const emailsStr = (data.emails || []).map((e) => e.address || "").join(",");
    return `${data.firstName || ""}|${data.lastName || ""}|${phonesStr}|${emailsStr}`;
  }, [data.firstName, data.lastName, data.phones, data.emails]);

  const debouncedIdentityString = useDebounce(identityString, 500);

  useEffect(() => {
    const currentValues = form.getValues();
    if (!currentValues.firstName?.trim()) {
      setTypedDuplicateCount(0);
      return;
    }

    let isMounted = true;
    const checkDuplicates = async () => {
      try {
        const contactToCheck = prepareContactData(currentValues, false);

        const { matchCount } = await apiJson<{ matchCount: number }>(
          `${CONTACTS_MODULE_CONTRACT.restBasePath}/duplicate-check`,
          { method: 'POST', body: JSON.stringify({ contact: contactToCheck }) },
        );

        if (isMounted) {
          setTypedDuplicateCount(matchCount);
        }
      } catch (err) {
        console.error("Background duplicate check failed", err);
      }
    };

    void checkDuplicates();

    return () => {
      isMounted = false;
    };
  }, [debouncedIdentityString, prepareContactData]);

  const formErrors = useMemo(() => {
    const list = errors.map((e) => e.message);
    if (typedDuplicateCount > 0) {
      list.push(`${typedDuplicateCount} ${t("contacts.duplicates.potentialFound") || "potential duplicates found"}`);
    }
    return list;
  }, [errors, typedDuplicateCount, t]);

  const commitSave = useCallback(
    (contactToSave: Contact) => {
      onSave(contactToSave);
      setSaveSuccess(true);
      notify.success(contact ? t('contacts.form.contactUpdated') : t('contacts.form.contactCreated'), {
        description: `${data?.name || data?.firstName || t('contacts.form.contact')} ${t('contacts.form.contactSavedSuccess')}`,
      });
      setTimeout(() => {
        setSaveSuccess(false);
        setSaving(false);
      }, 600);
    },
    [onSave, contact, data?.name, data?.firstName, t, setSaving],
  );

  const onSubmit = useCallback(async (formData: Contact) => {
    const contactToSave = prepareContactData(formData, true);

    try {
      const { matchCount } = await apiJson<{ matchCount: number }>(
        `${CONTACTS_MODULE_CONTRACT.restBasePath}/duplicate-check`,
        { method: 'POST', body: JSON.stringify({ contact: contactToSave }) },
      );
      if (matchCount > 0) {
        pendingSaveRef.current = contactToSave;
        setDuplicateCount(matchCount);
        setDuplicateConfirmOpen(true);
        return;
      }
    } catch {
      notify.error(t('settings.serverSaveFailed'));
      throw new Error("Server duplicate check failed");
    }

    commitSave(contactToSave);
  }, [commitSave, prepareContactData, t]);

  const defaultCountry  = prefs.defaultCountry  || defaultCountryProp;
  const defaultCity     = prefs.defaultCity     || defaultCityProp;
  const defaultProvince = prefs.defaultProvince || defaultProvinceProp;

  const completeness = useMemo(() => calculateProfileCompleteness(data, fieldConfig), [data, fieldConfig]);
  const visibleTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.formTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tabDef) => {
        if (!tabDef.enabled) return false;
        if (tabDef.key === "basic") return true;
        if (!enabledTabIds.has(tabDef.key)) return false;
        if (!canViewContactTab(viewerRole, tabDef)) return false;

        // Ghost Tab Prevention (Rule 4.3)
        const systemTabs = ["basic", "phones", "emails", "addresses", "socials", "emergency", "relationships"];
        const isSystemTab = systemTabs.includes(tabDef.key);

        const tabFields = fields[tabDef.key] || [];
        const hasVisibleFields = tabFields.some(
          (field) => field.enabled && canViewContactField(viewerRole, field)
        );

        if (!isSystemTab && !hasVisibleFields) {
          return false;
        }
        return true;
      });

    return sorted.map((t) => ({
      key: t.key,
      label: t.label,
      icon: t.icon && ICON_MAP[t.icon] ? ICON_MAP[t.icon] : User,
    }));
  }, [fieldConfig.formTabs, enabledTabIds, viewerRole, fields]);

  const tabCount = (tabKey: string): number => {
    const key = TAB_DATA_KEY[tabKey];
    if (!key) return 0;
    const list = data[key];
    return Array.isArray(list) ? list.length : 0;
  };

  const formTabs = useMemo(
    () =>
      visibleTabs.map((t) => {
        const count = tabCount(t.key);
        return {
          key: t.key,
          label: count > 0 && t.key !== "basic" ? `${t.label} [${count}]` : t.label,
          icon: t.icon,
        };
      }),
    [visibleTabs, data],
  );

  const handleChange = useCallback((updated: Partial<Contact>) => {
    Object.entries(updated).forEach(([key, val]) => {
      setValue(key as Parameters<typeof setValue>[0], val, { shouldValidate: true, shouldDirty: true });
    });
  }, [setValue]);

  const confirmDuplicateSave = useCallback(() => {
    if (pendingSaveRef.current) {
      setSaving(true);
      commitSave(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
    setDuplicateConfirmOpen(false);
  }, [commitSave, setSaving]);

  const tabReadOnlyKeys = useReadOnlyContactFieldKeys(tab);
  const readOnlyFieldKeys = useMemo(
    () => [...new Set([...tabReadOnlyKeys, ...(lockGender ? ["gender"] : [])])],
    [tabReadOnlyKeys, lockGender],
  );

  const renderBasicContent = () => {
    const systemTabs = ["basic", "phones", "emails", "addresses", "socials", "emergency", "relationships"];
    if (!systemTabs.includes(tab)) {
      return null;
    }

    const renderFn = SYSTEM_TAB_RENDERS[tab];
    if (renderFn) {
      return renderFn({
        data,
        onChange: handleChange,
        requiredTabIds,
        defaultCountry,
        defaultCity,
        defaultProvince,
        readOnlyFieldKeys,
        errors,
      });
    }
    return (
      <BasicTab
        tabId={tab}
        data={data}
        onChange={handleChange}
        readOnlyFieldKeys={readOnlyFieldKeys}
        errors={errors}
      />
    );
  };

  const footerStart = data.firstName ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{data.name || data.firstName}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>
          {data.phones?.length || 0} {t('contacts.form.phonesLabel')}
        </span>
        <span className="border-s border-border ps-2">
          {data.emails?.length || 0} {t('contacts.form.emailsLabel')}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">{t('contacts.form.firstNameRequired')}</span>
  );

  return (
    <>
      <MmsDynamicForm
        open={open}
        onClose={onClose}
        title={contact ? t('contacts.form.editTitle') : t('contacts.form.addTitle')}
        subtitle={contact ? t("contacts.form.editing", { name: contact.name || "" }) : t("contacts.form.createNewContact")}
        icon={User}
        tall
        progress={completeness}
        progressLabel={t('contacts.form.progress')}
        showBuilderToggle={canEditSetup}
        isBuilderMode={isBuilderMode}
        onBuilderModeChange={handleToggleBuilderMode}
        tabs={formTabs}
        activeTab={tab}
        onTabChange={setTab}
        tabPanelIdPrefix="contact-form-tab"
        error={formErrors}
        dir={isRtlLanguage(language) ? "rtl" : "ltr"}
        lang={language}
        cancelLabel={t('common.cancel')}
        saveLabel={t('contacts.form.saveContact')}
        savedLabel={t('contacts.form.saved')}
        onSave={() => void handleSave(onSubmit)()}
        saving={saving}
        saved={saveSuccess}
        saveDisabled={!data.firstName?.trim()}
        footerStart={footerStart}
        fields={fields[tab] || []}
        data={data}
        setValue={setValue}
        errors={errors}
        readOnlyFieldKeys={readOnlyFieldKeys}
        renderBasicContent={renderBasicContent}
        builderPanel={
          <ContactsSetupPanel
            config={fieldConfig}
            onConfigChange={updateConfig}
            mode="fields"
          />
        }
      />
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={setDuplicateConfirmOpen}
        title={t('contacts.form.saveContact')}
        description={t("contacts.duplicateSaveWarning", { count: duplicateCount })}
        confirmLabel={t("common.yes")}
        onConfirm={confirmDuplicateSave}
      />
    </>
  );
}
