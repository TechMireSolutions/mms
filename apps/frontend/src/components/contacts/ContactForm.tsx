import React, { useState, useMemo, useCallback } from "react";
import { Phone, Mail, MapPin, Share2, User, Heart, LucideIcon } from "lucide-react";
import { notify } from "@/lib/notify";
import FormModal from "@/components/ui/FormModal";
import { useContactConfig, useContactValidation, calculateProfileCompleteness, ValidationError } from '@/lib/contexts/ContactConfigContext';
import { toTitleCase, applyTitleCaseToContact, normalizeToE164, parsePhoneNumber, Contact } from "@mms/shared";
import BasicTab     from "./form/BasicTab";
import PhoneTab     from "./form/PhoneTab";
import EmailTab     from "./form/EmailTab";
import AddressTab   from "./form/AddressTab";
import SocialTab    from "./form/SocialTab";
import EmergencyTab from "./form/EmergencyTab";

// ── Constants ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  User, Phone, Mail, MapPin, Share2, Heart
};

const TAB_DATA_KEY: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
};

// ── Tab Rendering Registry ──────────────────────────────────────────────────
interface TabRenderProps {
  data: Partial<Contact>;
  onChange: (d: Partial<Contact>) => void;
  requiredTabIds: Set<string>;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  allContacts: Contact[];
  readOnlyFieldKeys?: string[];
}

const SYSTEM_TAB_RENDERS: Record<
  string,
  (props: TabRenderProps) => React.JSX.Element
> = {
  basic: ({ data, onChange, readOnlyFieldKeys }) => (
    <BasicTab tabId="basic" data={data} onChange={onChange} readOnlyFieldKeys={readOnlyFieldKeys} />
  ),
  phones: ({ data, onChange, requiredTabIds, defaultCountry }) => (
    <PhoneTab
      data={data as unknown as Parameters<typeof PhoneTab>[0]["data"]}
      onChange={onChange as unknown as Parameters<typeof PhoneTab>[0]["onChange"]}
      required={requiredTabIds.has("phones")}
      defaultCountry={defaultCountry}
    />
  ),
  emails: ({ data, onChange, requiredTabIds }) => (
    <EmailTab
      data={data as unknown as Parameters<typeof EmailTab>[0]["data"]}
      onChange={onChange as unknown as Parameters<typeof EmailTab>[0]["onChange"]}
      required={requiredTabIds.has("emails")}
    />
  ),
  addresses: ({ data, onChange, requiredTabIds, defaultCountry, defaultCity, defaultProvince }) => (
    <AddressTab
      data={data as unknown as Parameters<typeof AddressTab>[0]["data"]}
      onChange={onChange as unknown as Parameters<typeof AddressTab>[0]["onChange"]}
      required={requiredTabIds.has("addresses")}
      defaultCountry={defaultCountry}
      defaultCity={defaultCity}
      defaultProvince={defaultProvince}
    />
  ),
  socials: ({ data, onChange, requiredTabIds }) => (
    <SocialTab
      data={data as unknown as Parameters<typeof SocialTab>[0]["data"]}
      onChange={onChange as unknown as Parameters<typeof SocialTab>[0]["onChange"]}
      required={requiredTabIds.has("socials")}
    />
  ),
  emergency: ({ data, onChange, requiredTabIds, allContacts }) => (
    <EmergencyTab
      data={data as unknown as Parameters<typeof EmergencyTab>[0]["data"]}
      onChange={onChange as unknown as Parameters<typeof EmergencyTab>[0]["onChange"]}
      required={requiredTabIds.has("emergency")}
      allContacts={allContacts}
    />
  ),
};

interface ContactFormProps {
  open?: boolean;
  contact?: Contact;
  allContacts?: Contact[];
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

// ── Main form ─────────────────────────────────────────────────────────────────
/**
 * ContactForm component for creating or editing contact records.
 *
 * @param props - Component props.
 * @param props.contact - The contact object to edit, or undefined for a new contact.
 * @param props.allContacts - The complete list of system contacts.
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
  allContacts = [],
  onClose,
  onSave,
  defaultCountry: defaultCountryProp = "",
  defaultCity: defaultCityProp = "",
  defaultProvince: defaultProvinceProp = "",
  initialDraft,
  lockGender = false,
}: ContactFormProps): React.JSX.Element {
  // Always read from context (live updates from settings panel)
  const { fieldConfig, prefs, enabledTabIds, requiredTabIds, fields, countryCodesMap, lifecycleStages, defaultContactRating, defaultValueFor, uiStrings } = useContactConfig();
  const validate = useContactValidation();

  const [tab,         setTab]         = useState<string>("basic");
  const [data,        setData]        = useState<Partial<Contact>>(() => {
    const initial: Record<string, unknown> = {
      name: "",
      phones: [],
      emails: [],
      addresses: [],
      socials: [],
      emergencyContacts: [],
      relationships: [],
      activities: [],
    };
    Object.entries(fields).forEach(([_, tabFields]) => {
      (tabFields || []).forEach((f) => {
        if (f.enabled) {
          initial[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
        }
      });
    });
    if (initial.lifecycleStage === undefined || initial.lifecycleStage === "") {
      initial.lifecycleStage = lifecycleStages[0] || "";
    }
    if (initial.rating === undefined || initial.rating === "") {
      initial.rating = defaultContactRating;
    }
    if (initial.avatar === undefined) {
      initial.avatar = null;
    }

    if (!contact) {
      return { ...initial, ...initialDraft } as Partial<Contact>;
    }
    const defaultCode = countryCodesMap[defaultCountryProp] || "";
    const phones = (contact.phones || []).map((p) => {
      if (p.countryCode) return p;
      const parsed = parsePhoneNumber(p.number, defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    });
    // contactId is validated as a string field — coerce legacy numeric ids.
    const emergencyContacts = (contact.emergencyContacts || []).map((ec) => ({
      ...ec,
      contactId: ec.contactId == null || ec.contactId === "" ? "" : String(ec.contactId),
    }));
    return {
      ...initial,
      ...contact,
      phones,
      emergencyContacts,
    };
  });


  const [saving,      setSaving]      = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errors,      setErrors]      = useState<ValidationError[]>([]);

  const defaultCountry  = prefs.defaultCountry  || defaultCountryProp;
  const defaultCity     = prefs.defaultCity     || defaultCityProp;
  const defaultProvince = prefs.defaultProvince || defaultProvinceProp;

  const completeness = useMemo(() => calculateProfileCompleteness(data, fieldConfig), [data, fieldConfig]);
  const visibleTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.formTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((t) => t.enabled && (t.key === "basic" || enabledTabIds.has(t.key)));

    return sorted.map((t) => ({
      key: t.key,
      label: t.label,
      icon: t.icon && ICON_MAP[t.icon] ? ICON_MAP[t.icon] : User,
    }));
  }, [fieldConfig.formTabs, enabledTabIds]);

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
          label: count > 0 && t.key !== "basic" ? `${t.label} (${count})` : t.label,
        };
      }),
    [visibleTabs, data],
  );

  const handleChange = useCallback((d: Partial<Contact>) => {
    setErrors([]);
    setData(d);
  }, []);

  const handleSave = useCallback(async () => {
    const validationErrors = validate(data);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      notify.error(uiStrings.pleaseFixErrors, { description: validationErrors[0].message });
      
      // Auto-focus the tab containing the first error
      if (validationErrors[0].tabId) {
        setTab(validationErrors[0].tabId);
      }
      return;
    }

    setErrors([]);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const firstName = toTitleCase(data.firstName?.trim()) as string;
    const lastName  = toTitleCase(data.lastName?.trim()) as string;
    
    const defaultCode = countryCodesMap[defaultCountryProp] || "+92";
    const normalizedPhones = (data.phones || []).map((p) => {
      const e164 = normalizeToE164(p.countryCode || defaultCode, p.number);
      const parsed = parsePhoneNumber(e164, p.countryCode || defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    });

    const contactToSaveRaw: Contact = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(" "),
      phones: normalizedPhones,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    } as Contact;

    const contactToSave = applyTitleCaseToContact(contactToSaveRaw) as Contact;

    onSave(contactToSave);
    setSaveSuccess(true);
    notify.success(contact ? uiStrings.contactUpdated : uiStrings.contactCreated, {
      description: `${data.name || data.firstName || uiStrings.contact} ${uiStrings.contactSavedSuccess}`,
    });
    setTimeout(() => {
      setSaveSuccess(false);
      setSaving(false);
    }, 600);
  }, [data, onSave, contact, validate]);

  const readOnlyFieldKeys = useMemo(
    () => (lockGender ? ["gender"] : []),
    [lockGender],
  );

  const renderTab = () => {
    const renderFn = SYSTEM_TAB_RENDERS[tab];
    if (renderFn) {
      return renderFn({
        data,
        onChange: handleChange,
        requiredTabIds,
        defaultCountry,
        defaultCity,
        defaultProvince,
        allContacts,
        readOnlyFieldKeys,
      });
    }
    return (
      <BasicTab
        tabId={tab}
        data={data}
        onChange={handleChange}
        readOnlyFieldKeys={readOnlyFieldKeys}
      />
    );
  };

  const footerStart = data.firstName ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{data.name || data.firstName}</span>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <span>
          {data.phones?.length || 0} {uiStrings.phones}
        </span>
        <span className="border-l border-border pl-2">
          {data.emails?.length || 0} {uiStrings.emails}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">{uiStrings.first_name_required_to_save}</span>
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={contact ? uiStrings.editContactHeader : uiStrings.addNewContactHeader}
      icon={User}
      tall
      progress={completeness}
      progressLabel={uiStrings.progress}
      tabs={formTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="contact-form-tab"
      error={errors.map((e) => e.message)}
      cancelLabel={uiStrings.cancel}
      saveLabel={uiStrings.saveContact}
      savedLabel={uiStrings.saved}
      onSave={() => void handleSave()}
      saving={saving}
      saved={saveSuccess}
      saveDisabled={!data.firstName?.trim()}
      footerStart={footerStart}
    >
      {renderTab()}
    </FormModal>
  );
}
