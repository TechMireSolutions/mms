import React, { useState, useCallback, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  Heart,
  Plus,
  Camera,
  FileText,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import ContactPicker from "@/tenant/features/contacts/components/contactLink/ContactPicker";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { cn } from "@/lib/utils";
import {
  useContactConfig,
  useContactValidation,
  ValidationError,
} from "@/lib/contexts/ContactConfigContext";
import {
  toTitleCase,
  applyTitleCaseToContact,
  normalizeToE164,
  parsePhoneNumber,
  getInitials,
  getDisplayName,
  Contact,
  PhoneNumber,
  EmailAddress,
  Address,
  SocialLink,
  EmergencyContact,
  RELATIONSHIPS,
  todayISO,
  formatCnic,
} from "@mms/shared";
import {
  Field,
  CardRemoveButton,
  EditableSelect,
  TYPE_SELECT_WIDTH,
} from "@/components/ui/FormPrimitives";
import { FORM_CARD } from "@/components/ui/formStyles";
import { SectionCard } from "@/components/ui/SectionCard";

const SUPPORTED_DIAL_CODES = ["+92", "+1", "+44"] as const;

const parsePhoneEntry = (phone: PhoneNumber) => {
  const trimmed = (phone.number || "").trim();
  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    return parsePhoneNumber(trimmed, phone.countryCode || "+92", [...SUPPORTED_DIAL_CODES]);
  }
  const e164 = normalizeToE164(phone.countryCode || "+92", phone.number);
  return parsePhoneNumber(e164, phone.countryCode || "+92", [...SUPPORTED_DIAL_CODES]);
};

const getPhoneDisplayValue = (phone: PhoneNumber): string => {
  const code = (phone.countryCode || "").trim();
  const num = (phone.number || "").trim();
  if (!code) return num;
  if (num.startsWith("+") || num.startsWith(code) || num.startsWith("00")) return num;
  return `${code} ${num}`.trim();
};

const cleanContactDraft = (draft: Partial<Contact>): Partial<Contact> => {
  const result = { ...draft };

  if (Array.isArray(result.phones)) {
    result.phones = result.phones.filter((phone) => (phone.number || "").trim().length > 0);
  }
  if (Array.isArray(result.emails)) {
    result.emails = result.emails.filter((email) => (email.address || "").trim().length > 0);
  }
  if (Array.isArray(result.addresses)) {
    result.addresses = result.addresses.filter((address) => (address.line1 || "").trim().length > 0);
  }
  if (Array.isArray(result.socials)) {
    result.socials = result.socials.filter((social) => (social.url || "").trim().length > 0);
  }
  if (Array.isArray(result.emergencyContacts)) {
    result.emergencyContacts = result.emergencyContacts.filter(
      (em) => em.contactId != null && String(em.contactId).trim().length > 0,
    );
  }

  return result;
};

interface ContactFormProps {
  open?: boolean;
  contact?: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  defaultCountry?: string;
  defaultCity?: string;
  defaultProvince?: string;
  initialDraft?: Partial<Contact>;
  lockGender?: boolean;
}

const CONTACT_TABS = [
  { key: "basic", label: "Basic Info", icon: User },
  { key: "phones", label: "Phones", icon: Phone },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "socials", label: "Socials", icon: Share2 },
  { key: "emergency", label: "Emergency", icon: Heart },
] as const;

type TabKey = (typeof CONTACT_TABS)[number]["key"];

const normalizePhoneItem = (item: unknown, index: number): PhoneNumber => {
  if (!item) return { label: "Mobile", number: "", countryCode: "+92", isPrimary: index === 0 };
  if (typeof item === "string") {
    const parsed = parsePhoneEntry({ label: "Mobile", number: item, countryCode: "+92" });
    return { label: "Mobile", number: parsed.number || item, countryCode: parsed.countryCode || "+92", isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const rawNum = String(obj.number || obj.phone || obj.value || obj.num || "").trim();
    const label = String(obj.label || obj.type || "Mobile").trim();
    const countryCode = String(obj.countryCode || obj.code || "+92").trim();
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    const whatsappStatus = obj.whatsappStatus as PhoneNumber["whatsappStatus"];
    const parsed = parsePhoneEntry({ label, number: rawNum, countryCode });
    return {
      label: label || "Mobile",
      number: parsed.number || rawNum,
      countryCode: countryCode || parsed.countryCode || "+92",
      isPrimary,
      whatsappStatus,
    };
  }
  return { label: "Mobile", number: "", countryCode: "+92", isPrimary: index === 0 };
};

const normalizeEmailItem = (item: unknown, index: number): EmailAddress => {
  if (!item) return { label: "Personal", address: "", isPrimary: index === 0 };
  if (typeof item === "string") {
    return { label: "Personal", address: item.trim(), isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const address = String(obj.address || obj.email || obj.value || "").trim();
    const label = String(obj.label || obj.type || "Personal").trim();
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    const isVerified = typeof obj.isVerified === "boolean" ? obj.isVerified : undefined;
    return { label: label || "Personal", address, isPrimary, isVerified };
  }
  return { label: "Personal", address: "", isPrimary: index === 0 };
};

const normalizeAddressItem = (
  item: unknown,
  defaultCity: string,
  defaultProvince: string,
  defaultCountry: string,
  index: number,
): Address => {
  if (!item) return { label: "Home", line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
  if (typeof item === "string") {
    return { label: "Home", line1: item.trim(), city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const line1 = String(obj.line1 || obj.address || obj.street || obj.value || "").trim();
    const city = String(obj.city || defaultCity).trim();
    const state = String(obj.state || obj.province || defaultProvince).trim();
    const country = String(obj.country || defaultCountry).trim();
    const label = String(obj.label || obj.type || "Home").trim();
    const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : index === 0;
    return { label: label || "Home", line1, city, state, country, isPrimary };
  }
  return { label: "Home", line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry, isPrimary: index === 0 };
};

const normalizeSocialItem = (item: unknown): SocialLink => {
  if (!item) return { platform: "WhatsApp", url: "" };
  if (typeof item === "string") {
    return { platform: "WhatsApp", url: item.trim() };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const url = String(obj.url || obj.link || obj.value || "").trim();
    const platform = String(obj.platform || obj.type || "WhatsApp").trim();
    return { platform: platform || "WhatsApp", url };
  }
  return { platform: "WhatsApp", url: "" };
};

const normalizeEmergencyItem = (item: unknown): EmergencyContact => {
  if (!item) return { relationship: "Father", contactId: "" };
  if (typeof item === "string" || typeof item === "number") {
    return { relationship: "Father", contactId: String(item) };
  }
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const contactId = String(obj.contactId || obj.id || obj.targetId || "").trim();
    const relationship = String(obj.relationship || obj.relation || obj.type || "Father").trim();
    return { relationship: relationship || "Father", contactId };
  }
  return { relationship: "Father", contactId: "" };
};

const normalizeContactForEdit = (
  raw: Partial<Contact> | undefined,
  initialDraft: Partial<Contact> | undefined,
  defaultCity: string,
  defaultProvince: string,
  defaultCountry: string,
): Partial<Contact> => {
  const merged: Partial<Contact> = {
    firstName: "",
    lastName: "",
    name: "",
    gender: "",
    dob: "",
    cnic: "",
    isSyed: false,
    notes: "",
    phones: [],
    emails: [],
    addresses: [],
    socials: [],
    emergencyContacts: [],
    relationships: [],
    ...initialDraft,
    ...raw,
  };

  // 1. First Name / Last Name resolution from name if unpopulated
  let firstName = (merged.firstName || "").trim();
  let lastName = (merged.lastName || "").trim();
  const fullName = (merged.name || "").trim();

  if (!firstName && fullName) {
    const parts = fullName.split(" ").filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  // 2. Phones resolution (array of strings or objects, plus legacy scalar phone)
  let phones: PhoneNumber[] = Array.isArray(merged.phones)
    ? merged.phones.map((item, idx) => normalizePhoneItem(item, idx))
    : [];

  const scalarPhone = typeof (merged as Record<string, unknown>).phone === "string" ? String((merged as Record<string, unknown>).phone).trim() : "";
  if (scalarPhone && !phones.some((p) => (p.number || "").trim() === scalarPhone)) {
    phones.unshift(normalizePhoneItem(scalarPhone, 0));
  }

  if (phones.length === 0) {
    phones = [{ label: "Mobile", number: "", countryCode: "+92", isPrimary: true }];
  }

  // 3. Emails resolution (array of strings or objects, plus legacy scalar email)
  let emails: EmailAddress[] = Array.isArray(merged.emails)
    ? merged.emails.map((item, idx) => normalizeEmailItem(item, idx))
    : [];

  const scalarEmail = typeof (merged as Record<string, unknown>).email === "string" ? String((merged as Record<string, unknown>).email).trim() : "";
  if (scalarEmail && !emails.some((e) => (e.address || "").trim().toLowerCase() === scalarEmail.toLowerCase())) {
    emails.unshift(normalizeEmailItem(scalarEmail, 0));
  }

  if (emails.length === 0) {
    emails = [{ label: "Personal", address: "", isPrimary: true }];
  }

  // 4. Addresses resolution (array of strings or objects, plus scalar address fields)
  let addresses: Address[] = Array.isArray(merged.addresses)
    ? merged.addresses.map((item, idx) => normalizeAddressItem(item, defaultCity, defaultProvince, defaultCountry, idx))
    : [];

  const scalarLine1 = (merged.line1 as string || merged.address as string || "").trim();
  const scalarCity = (merged.city as string || "").trim();
  const scalarState = (merged.state as string || "").trim();
  const scalarCountry = (merged.country as string || "").trim();

  if ((scalarLine1 || scalarCity || scalarState || scalarCountry) && addresses.length === 0) {
    addresses = [
      {
        label: "Home",
        line1: scalarLine1,
        city: scalarCity || defaultCity,
        state: scalarState || defaultProvince,
        country: scalarCountry || defaultCountry,
      },
    ];
  }

  if (addresses.length === 0) {
    addresses = [
      {
        label: "Home",
        line1: "",
        city: defaultCity,
        state: defaultProvince,
        country: defaultCountry,
      },
    ];
  }

  // 5. Socials & Emergency Contacts (array of strings or objects)
  let socials: SocialLink[] = Array.isArray(merged.socials)
    ? merged.socials.map(normalizeSocialItem)
    : [];

  if (socials.length === 0) {
    socials = [{ platform: "WhatsApp", url: "" }];
  }

  let emergencyContacts: EmergencyContact[] = Array.isArray(merged.emergencyContacts)
    ? merged.emergencyContacts.map(normalizeEmergencyItem)
    : [];

  if (emergencyContacts.length === 0) {
    emergencyContacts = [{ relationship: "Father", contactId: "" }];
  }

  return {
    ...merged,
    firstName,
    lastName,
    name: fullName || [firstName, lastName].filter(Boolean).join(" "),
    phones,
    emails,
    addresses,
    socials,
    emergencyContacts,
  };
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
}: ContactFormProps): React.JSX.Element {
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
  } = useContactConfig();
  const validate = useContactValidation();

  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const localIdMap = React.useRef<Map<string, string>>(new Map());

  /** Returns a stable UUID for a given list slot. Survives re-renders. */
  const getLocalId = (tab: string, idx: number): string => {
    const key = `${tab}:${idx}`;
    if (!localIdMap.current.has(key)) {
      localIdMap.current.set(key, crypto.randomUUID());
    }
    return localIdMap.current.get(key)!;
  };

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
  );

  // Re-sync draft when editing another contact or re-opening modal
  React.useEffect(() => {
    if (!open) return;
    localIdMap.current.clear();
    setTab("basic");
    setContactDraft(
      normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
    );
    setValidationErrors([]);
  }, [open, contact, initialDraft, defaultCity, defaultProvince, defaultCountry]);

  const visibleTabs = useMemo(() => {
    const phoneCount = (contactDraft.phones || []).filter(p => (p.number || "").trim()).length;
    const emailCount = (contactDraft.emails || []).filter(e => (e.address || "").trim()).length;
    const addressCount = (contactDraft.addresses || []).filter(a => (a.line1 || a.city || "").trim()).length;
    const socialCount = (contactDraft.socials || []).filter(s => (s.url || "").trim()).length;
    const emergencyCount = (contactDraft.emergencyContacts || []).filter(e => e.contactId).length;

    const countMap: Record<string, number> = {
      phones: phoneCount,
      emails: emailCount,
      addresses: addressCount,
      socials: socialCount,
      emergency: emergencyCount,
    };

    return CONTACT_TABS.map((tabItem) => {
      const count = countMap[tabItem.key];
      return {
        ...tabItem,
        badge: count && count > 0 ? count : undefined,
      };
    });
  }, [contactDraft.phones, contactDraft.emails, contactDraft.addresses, contactDraft.socials, contactDraft.emergencyContacts]);

  const isFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFields = fields[tabId] || [];
      const exists = tabFields.some((f) => f.key === fieldId);
      if (!exists) return true; // Default standard database columns to true if not registered in fields
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
        (err) =>
          err.tabId === tabId && err.fieldId === fieldId && err.index === index,
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

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
    const phone = (contactDraft.phones || [])[index];
    if (!phone || !phone.number) return;
    const parsed = parsePhoneEntry(phone);
    const updatedPhones = [...(contactDraft.phones || [])];
    updatedPhones[index] = { ...phone, countryCode: parsed.countryCode, number: parsed.number };
    updateDraft({ phones: updatedPhones });
  };

  const handleSave = () => {
    setValidationErrors([]);
    const cleanedDraft = cleanContactDraft(contactDraft);
    const formErrors = validate(cleanedDraft);

    // Custom Pakistani CNIC validation (13 digits)
    if (cleanedDraft.cnic) {
      const cleanCnic = cleanedDraft.cnic.replace(/\D/g, "");
      if (cleanCnic.length > 0 && cleanCnic.length !== 13) {
        formErrors.push({
          fieldId: "cnic",
          tabId: "basic",
          message:
            t("contacts.form.cnicInvalid") ||
            "CNIC must be in the format 99999 9999999 9",
        });
      }
    }

    if (formErrors.length > 0) {
      setValidationErrors(formErrors);
      const firstError = formErrors[0];
      if (firstError.tabId) {
        setTab(firstError.tabId as TabKey);
      }
      notify.error(
        t("contacts.form.pleaseFixErrors") || "Please fix validation errors",
      );
      return;
    }

    setSaving(true);
    try {
      // Normalize and format data
      const firstName = toTitleCase((cleanedDraft.firstName || "").trim());
      const lastName = toTitleCase((cleanedDraft.lastName || "").trim());

      const normalizedPhones = (cleanedDraft.phones || []).map((phone) => {
        const parsed = parsePhoneEntry(phone);
        return { ...phone, countryCode: parsed.countryCode, number: parsed.number };
      });

      const contactRaw: Contact = {
        ...cleanedDraft,
        id: cleanedDraft.id || contact?.id || crypto.randomUUID(),
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" "),
        phones: normalizedPhones,
        updatedAt: todayISO(),
        createdAt:
          cleanedDraft.createdAt || todayISO(),
      } as Contact;

      const finalized = applyTitleCaseToContact(contactRaw) as Contact;

      onSave(finalized);
      notify.success(
        contact
          ? t("contacts.form.contactUpdated")
          : t("contacts.form.contactCreated"),
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

  // Tab sub-renders
  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <SectionCard
        title={t("contacts.form.createNewContact") || "Basic Info"}
        icon={User}
        accentColor="primary"
      >
        {isFieldEnabled("basic", "avatar") && (
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-2 border-b border-border/60">
            {cropSrc && (
              <AvatarCropper
                src={cropSrc}
                onCrop={(url) => {
                  updateDraft({ avatar: url });
                  setCropSrc(null);
                }}
                onCancel={() => setCropSrc(null)}
              />
            )}
            <div className="relative flex-shrink-0 group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/30 via-accent/30 to-secondary/30 group-hover:from-primary/60 group-hover:via-accent/60 group-hover:to-secondary/60 blur-[2px] transition-all duration-500 opacity-75 group-hover:opacity-100" />
              <div className="relative w-20 h-20 rounded-full bg-card overflow-hidden flex items-center justify-center border border-border/80 shadow-surface group-hover:scale-[1.02] transition-transform duration-300">
                {contactDraft.avatar ? (
                  <img
                    src={contactDraft.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary select-none">
                    {getInitials(getDisplayName(contactDraft))}
                  </span>
                )}

                <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white gap-1 rounded-full">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("account.changePhoto") || "Change"}
                  </span>
                  <input
                    id="contact-avatar-file-input"
                    name="avatarFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    aria-label={t("account.changePhoto") || "Change Photo"}
                  />
                </label>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {contactDraft.name ||
                  t("contacts.form.createNewContact") ||
                  "New Contact"}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                {contactDraft.gender &&
                  contactDraft.gender !== "unspecified" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/80">
                      {contactDraft.gender}
                    </span>
                  )}
                {contactDraft.isSyed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                    {t("contacts.reportFields.isSyed") || "Syed"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isFieldEnabled("basic", "firstName") && (
            <Field
              label={t("contacts.reportFields.firstName")}
              required
              error={getFieldError("firstName")}
              id="firstName"
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="firstName"
                  name="firstName"
                  value={contactDraft.firstName || ""}
                  onChange={(e) => updateDraft({ firstName: e.target.value })}
                  placeholder={t("contacts.reportFields.firstName")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "lastName") && (
            <Field
              label={t("contacts.reportFields.lastName")}
              error={getFieldError("lastName")}
              id="lastName"
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="lastName"
                  name="lastName"
                  value={contactDraft.lastName || ""}
                  onChange={(e) => updateDraft({ lastName: e.target.value })}
                  placeholder={t("contacts.reportFields.lastName")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          <Field
            label={t("contacts.reportFields.phone")}
            id="primaryPhone"
          >
            <div className="relative flex items-center group/input">
              <Phone className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="primaryPhone"
                name="primaryPhone"
                type="tel"
                value={(contactDraft.phones || [])[0]?.number || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const current = [...(contactDraft.phones || [])];
                  if (current.length === 0) {
                    current.push({ label: "Mobile", number: val, countryCode: "+92", isPrimary: true });
                  } else {
                    current[0] = { ...current[0], number: val };
                  }
                  updateDraft({ phones: current });
                }}
                placeholder={t("contacts.form.phoneNumberPlaceholder")}
                className="pl-10"
              />
            </div>
          </Field>

          <Field
            label={t("contacts.reportFields.email")}
            id="primaryEmail"
          >
            <div className="relative flex items-center group/input">
              <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="primaryEmail"
                name="primaryEmail"
                type="email"
                value={(contactDraft.emails || [])[0]?.address || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const current = [...(contactDraft.emails || [])];
                  if (current.length === 0) {
                    current.push({ label: "Personal", address: val, isPrimary: true });
                  } else {
                    current[0] = { ...current[0], address: val };
                  }
                  updateDraft({ emails: current });
                }}
                placeholder="e.g. name@domain.com"
                className="pl-10"
              />
            </div>
          </Field>

          {isFieldEnabled("basic", "gender") && (
            <Field
              label={t("contacts.reportFields.gender")}
              error={getFieldError("gender")}
              id="gender"
            >
              {lockGender ? (
                <div className="flex h-10 w-full items-center rounded-xl border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground select-none font-semibold">
                  {toTitleCase(contactDraft.gender || "unspecified")}
                </div>
              ) : (
                <EditableSelect
                  options={
                    genders.length > 0
                      ? genders
                      : ["male", "female", "other", "unspecified"]
                  }
                  value={contactDraft.gender || ""}
                  onChange={(val) => updateDraft({ gender: val.toLowerCase() })}
                  placeholder={t("contacts.form.selectOption")}
                  className="w-full"
                />
              )}
            </Field>
          )}

          {isFieldEnabled("basic", "dob") && (
            <Field
              label={t("contacts.reportFields.dob")}
              error={getFieldError("dob")}
              id="dob"
            >
              <DatePicker
                value={contactDraft.dob || undefined}
                onChange={(dateStr) => updateDraft({ dob: dateStr })}
              />
            </Field>
          )}

          {isFieldEnabled("basic", "cnic") && (
            <Field
              label={t("contacts.form.cnic") || "CNIC"}
              id="cnic"
              error={getFieldError("cnic")}
            >
              <div className="relative flex items-center group/input">
                <FileText className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id="cnic"
                  name="cnic"
                  value={contactDraft.cnic || ""}
                  onChange={(e) => {
                    const formatted = formatCnic(e.target.value);
                    updateDraft({ cnic: formatted });
                  }}
                  placeholder={
                    t("contacts.form.cnicPlaceholder") || "99999 9999999 9"
                  }
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "isSyed") && (
            <div className="flex flex-col justify-end min-h-[44px]">
              <label
                htmlFor="isSyed"
                className={cn(
                  "flex items-center gap-3 py-3 px-4.5 rounded-xl border select-none cursor-pointer transition-all duration-300",
                  contactDraft.isSyed
                    ? "bg-primary/10 border-primary/45 shadow-sm"
                    : "bg-muted/5 border-border/80 hover:bg-muted/10 hover:border-border",
                )}
              >
                <Checkbox
                  id="isSyed"
                  checked={!!contactDraft.isSyed}
                  onCheckedChange={(checked) =>
                    updateDraft({ isSyed: !!checked })
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {t("contacts.reportFields.isSyed")}
                  </span>
                  <Star
                    className={cn(
                      "w-4 h-4 transition-all duration-300",
                      contactDraft.isSyed
                        ? "text-amber-500 fill-amber-500 scale-110"
                        : "text-muted-foreground/40",
                    )}
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      </SectionCard>

      {isFieldEnabled("basic", "notes") && (
        <SectionCard
          title={t("contacts.form.notes") || "Notes"}
          icon={FileText}
          accentColor="amber"
        >
          <Field
            label={t("contacts.form.notes")}
            id="notes"
            error={getFieldError("notes")}
          >
            <Textarea
              id="notes"
              name="notes"
              value={(contactDraft.notes as string) || ""}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder={t("contacts.form.notesPlaceholder") || "Add notes about this contact"}
              className="min-h-[88px] resize-y"
            />
          </Field>
        </SectionCard>
      )}

      <SectionCard
        title={t("contacts.form.communicationPreferences") || "Communication Preferences"}
        icon={Mail}
        accentColor="primary"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t("contacts.form.preferredLanguage") || "Preferred Language"}
            id="preferredLanguage"
          >
            <EditableSelect
              options={["en", "ur", "ar", "fa"]}
              value={contactDraft.preferredLanguage || "en"}
              onChange={(val) => updateDraft({ preferredLanguage: val as 'en' | 'ur' | 'ar' | 'fa' })}
              placeholder="Select Language"
              className="w-full"
            />
          </Field>

          <Field
            label={t("contacts.form.preferredContactMethod") || "Preferred Contact Method"}
            id="preferredContactMethod"
          >
            <EditableSelect
              options={["whatsapp", "sms", "email", "phone_call"]}
              value={contactDraft.preferredContactMethod || "whatsapp"}
              onChange={(val) => updateDraft({ preferredContactMethod: val as 'whatsapp' | 'sms' | 'email' | 'phone_call' })}
              placeholder="Select Method"
              className="w-full"
            />
          </Field>
        </div>

        <div className="mt-4">
          <label
            htmlFor="doNotContact"
            className={cn(
              "flex items-center gap-3 py-3 px-4.5 rounded-xl border select-none cursor-pointer transition-all duration-300",
              contactDraft.doNotContact
                ? "bg-rose-500/10 border-rose-500/45 shadow-sm"
                : "bg-muted/5 border-border/80 hover:bg-muted/10 hover:border-border",
            )}
          >
            <Checkbox
              id="doNotContact"
              checked={!!contactDraft.doNotContact}
              onCheckedChange={(checked) => updateDraft({ doNotContact: !!checked })}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:text-white"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {t("contacts.form.doNotContact") || "Opt out of automated bulk messaging (Do Not Contact)"}
              </span>
            </div>
          </label>
        </div>
      </SectionCard>
    </div>
  );

  const renderPhones = () => {
    const phones = contactDraft.phones || [];
    const addPhone = () =>
      updateDraft({
        phones: [...phones, { label: "Mobile", number: "", countryCode: "+92" }],
      });
    const removePhone = (idx: number) => {
      // Shift map entries down after removal so stable keys follow items
      const newLen = phones.length - 1;
      for (let i = idx; i < newLen; i++) {
        const next = localIdMap.current.get(`phones:${i + 1}`);
        if (next !== undefined) localIdMap.current.set(`phones:${i}`, next);
      }
      localIdMap.current.delete(`phones:${newLen}`);
      updateDraft({ phones: phones.filter((_, i) => i !== idx) });
    };
    const updatePhone = (idx: number, patch: Partial<PhoneNumber>) => {
      updateDraft({
        phones: phones.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
      });
    };

    return (
      <div className="space-y-3 text-left">
        {phones.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/85 rounded-2xl bg-muted/5 backdrop-blur-sm">
            <Phone className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("contacts.form.noPhoneNumbersYet")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {phones.map((phone, idx) => {
              const numError = getListItemError("phones", "number", idx);
              return (
                <motion.div
                  key={getLocalId("phones", idx)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.type")}:
                      </span>
                      <EditableSelect
                        options={
                          phoneLabels.length > 0
                            ? phoneLabels
                            : ["Mobile", "Home", "Work", "WhatsApp", "Other"]
                        }
                        value={phone.label || "Mobile"}
                        onChange={(val) => updatePhone(idx, { label: val })}
                        className={TYPE_SELECT_WIDTH}
                      />
                    </div>
                    <CardRemoveButton
                      onClick={() => removePhone(idx)}
                      label={t("contacts.form.removePhoneNumber", { index: idx + 1 })}
                    />
                  </div>

                  <div className="relative flex items-center group/input w-full">
                    <Phone className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      type="tel"
                      value={getPhoneDisplayValue(phone)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const trimmed = val.trim();
                        if (
                          trimmed.startsWith("+") ||
                          trimmed.startsWith("00")
                        ) {
                          if (trimmed.length > 6) {
                            const parsed = parsePhoneNumber(
                              val,
                              phone.countryCode || "+92",
                              ["+92", "+1", "+44"],
                            );
                            updatePhone(idx, {
                              countryCode: parsed.countryCode,
                              number: parsed.number,
                            });
                            return;
                          }
                        }
                        updatePhone(idx, { number: val });
                      }}
                      onBlur={() => handlePhoneBlur(idx)}
                      placeholder={t("contacts.form.phoneNumberPlaceholder")}
                      className={cn(
                        "pl-10",
                        numError &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {numError && (
                    <p className="text-[10px] text-destructive mt-1 font-medium">
                      {numError}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={addPhone}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addPhoneNumber")}</span>
        </Button>
      </div>
    );
  };

  const renderEmails = () => {
    const emails = contactDraft.emails || [];
    const addEmail = () =>
      updateDraft({ emails: [...emails, { label: "Personal", address: "" }] });
    const removeEmail = (idx: number) => {
      const newLen = emails.length - 1;
      for (let i = idx; i < newLen; i++) {
        const next = localIdMap.current.get(`emails:${i + 1}`);
        if (next !== undefined) localIdMap.current.set(`emails:${i}`, next);
      }
      localIdMap.current.delete(`emails:${newLen}`);
      updateDraft({ emails: emails.filter((_, i) => i !== idx) });
    };
    const updateEmail = (idx: number, patch: Partial<EmailAddress>) => {
      updateDraft({
        emails: emails.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
      });
    };

    return (
      <div className="space-y-3 text-left">
        {emails.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-muted/5 backdrop-blur-sm">
            <Mail className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("contacts.form.noEmailAddressesYet")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {emails.map((email, idx) => {
              const emailError = getListItemError("emails", "address", idx);
              return (
                <motion.div
                  key={getLocalId("emails", idx)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-amber-500/60 transition-colors group-hover:bg-amber-500" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-amber-500/70 group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.type")}:
                      </span>
                      <EditableSelect
                        options={
                          emailLabels.length > 0
                            ? emailLabels
                            : ["Personal", "Work", "Other"]
                        }
                        value={email.label || "Personal"}
                        onChange={(val) => updateEmail(idx, { label: val })}
                        className={TYPE_SELECT_WIDTH}
                      />
                    </div>
                    <CardRemoveButton
                      onClick={() => removeEmail(idx)}
                      label={t("contacts.form.removeEmailAddress", { index: idx + 1 })}
                    />
                  </div>

                  <div className="relative flex items-center group/input">
                    <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      type="email"
                      value={email.address || ""}
                      onChange={(e) =>
                        updateEmail(idx, { address: e.target.value })
                      }
                      placeholder={t("auth.emailAddress")}
                      className={cn(
                        "pl-10",
                        emailError &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[10px] text-destructive mt-1 font-medium">
                      {emailError}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={addEmail}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addEmailAddress")}</span>
        </Button>
      </div>
    );
  };

  const renderAddresses = () => {
    const addresses = contactDraft.addresses || [];
    const addAddress = () =>
      updateDraft({
        addresses: [
          ...addresses,
          {
            label: "Home",
            line1: "",
            city: defaultCity,
            state: defaultProvince,
            country: defaultCountry,
          },
        ],
      });
    const removeAddress = (idx: number) => {
      const newLen = addresses.length - 1;
      for (let i = idx; i < newLen; i++) {
        const next = localIdMap.current.get(`addresses:${i + 1}`);
        if (next !== undefined) localIdMap.current.set(`addresses:${i}`, next);
      }
      localIdMap.current.delete(`addresses:${newLen}`);
      updateDraft({ addresses: addresses.filter((_, i) => i !== idx) });
    };
    const updateAddress = (idx: number, patch: Partial<Address>) => {
      updateDraft({
        addresses: addresses.map((a, i) =>
          i === idx ? { ...a, ...patch } : a,
        ),
      });
    };

    return (
      <div className="space-y-3 text-left">
        {addresses.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-muted/5 backdrop-blur-sm">
            <MapPin className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("contacts.form.noAddressesYet")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {addresses.map((addr, idx) => {
              const line1Error = getListItemError("addresses", "line1", idx);
              const cityError = getListItemError("addresses", "city", idx);
              return (
                <motion.div
                  key={getLocalId("addresses", idx)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.type")}:
                      </span>
                      <EditableSelect
                        options={
                          addressLabels.length > 0
                            ? addressLabels
                            : ["Home", "Work", "Billing", "Other"]
                        }
                        value={addr.label || "Home"}
                        onChange={(val) => updateAddress(idx, { label: val })}
                        className={TYPE_SELECT_WIDTH}
                      />
                    </div>
                    <CardRemoveButton
                      onClick={() => removeAddress(idx)}
                      label={t("contacts.form.removeAddress", { index: idx + 1 })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="relative flex items-center group/input">
                        <MapPin className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                        <Input
                          value={addr.line1 || ""}
                          onChange={(e) =>
                            updateAddress(idx, { line1: e.target.value })
                          }
                          placeholder={t("contacts.reportFields.streetAddress")}
                          className={cn(
                            "pl-10",
                            line1Error &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </div>
                      {line1Error && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">
                          {line1Error}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <Input
                          value={addr.city || ""}
                          onChange={(e) =>
                            updateAddress(idx, { city: e.target.value })
                          }
                          placeholder={t("contacts.reportFields.city")}
                          className={cn(
                            cityError &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {cityError && (
                          <p className="text-[10px] text-destructive mt-1 font-medium">
                            {cityError}
                          </p>
                        )}
                      </div>
                      <Input
                        value={addr.state || ""}
                        onChange={(e) =>
                          updateAddress(idx, { state: e.target.value })
                        }
                        placeholder={t("contacts.reportFields.state")}
                      />
                      <Input
                        value={addr.country || ""}
                        onChange={(e) =>
                          updateAddress(idx, { country: e.target.value })
                        }
                        placeholder={t("contacts.reportFields.country")}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={addAddress}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addAddress")}</span>
        </Button>
      </div>
    );
  };

  const renderSocials = () => {
    const socials = contactDraft.socials || [];
    const addSocial = () =>
      updateDraft({ socials: [...socials, { platform: "WhatsApp", url: "" }] });
    const removeSocial = (idx: number) => {
      const newLen = socials.length - 1;
      for (let i = idx; i < newLen; i++) {
        const next = localIdMap.current.get(`socials:${i + 1}`);
        if (next !== undefined) localIdMap.current.set(`socials:${i}`, next);
      }
      localIdMap.current.delete(`socials:${newLen}`);
      updateDraft({ socials: socials.filter((_, i) => i !== idx) });
    };
    const updateSocial = (idx: number, patch: Partial<SocialLink>) => {
      updateDraft({
        socials: socials.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
      });
    };

    return (
      <div className="space-y-3 text-left">
        {socials.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-muted/5 backdrop-blur-sm">
            <Share2 className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("contacts.form.noSocialLinksYet")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {socials.map((soc, idx) => {
              const urlError = getListItemError("socials", "url", idx);
              return (
                <motion.div
                  key={getLocalId("socials", idx)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-indigo-500/60 transition-colors group-hover:bg-indigo-500" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-indigo-500/70 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.type")}:
                      </span>
                      <EditableSelect
                        options={
                          socialPlatforms.length > 0
                            ? socialPlatforms
                            : [
                                "WhatsApp",
                                "Facebook",
                                "Twitter/X",
                                "LinkedIn",
                                "Instagram",
                                "YouTube",
                                "Other",
                              ]
                        }
                        value={soc.platform || "WhatsApp"}
                        onChange={(val) => updateSocial(idx, { platform: val })}
                        className={TYPE_SELECT_WIDTH}
                      />
                    </div>
                    <CardRemoveButton
                      onClick={() => removeSocial(idx)}
                      label={t("contacts.form.removeSocialLink", { index: idx + 1 })}
                    />
                  </div>

                  <div className="relative flex items-center group/input">
                    <Share2 className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      value={soc.url || ""}
                      onChange={(e) =>
                        updateSocial(idx, { url: e.target.value })
                      }
                      placeholder={t("contacts.form.socialHandlePlaceholder") || "Username, handle or link URL"}
                      className={cn(
                        "pl-10",
                        urlError &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {urlError && (
                    <p className="text-[10px] text-destructive mt-1 font-medium">
                      {urlError}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={addSocial}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addSocialLink")}</span>
        </Button>
      </div>
    );
  };

  const renderEmergency = () => {
    const emergencyContacts = contactDraft.emergencyContacts || [];
    const addEmergency = () =>
      updateDraft({
        emergencyContacts: [
          ...emergencyContacts,
          { relationship: "Father", contactId: "" },
        ],
      });
    const removeEmergency = (idx: number) => {
      const newLen = emergencyContacts.length - 1;
      for (let i = idx; i < newLen; i++) {
        const next = localIdMap.current.get(`emergency:${i + 1}`);
        if (next !== undefined) localIdMap.current.set(`emergency:${i}`, next);
      }
      localIdMap.current.delete(`emergency:${newLen}`);
      updateDraft({
        emergencyContacts: emergencyContacts.filter((_, i) => i !== idx),
      });
    };
    const updateEmergency = (idx: number, patch: Partial<EmergencyContact>) => {
      updateDraft({
        emergencyContacts: emergencyContacts.map((em, i) =>
          i === idx ? { ...em, ...patch } : em,
        ),
      });
    };
    const excludeIds = (idx: number): (string | number)[] => {
      const linked = emergencyContacts
        .filter((_, i) => i !== idx)
        .map((em) => em.contactId)
        .filter((cid) => cid != null && String(cid).length > 0) as (
        string | number
      )[];
      if (contactDraft.id != null) linked.unshift(contactDraft.id);
      return linked;
    };

    return (
      <div className="space-y-3 text-left">
        {emergencyContacts.length === 0 && (
          <div className="text-center py-8 border border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5 backdrop-blur-sm">
            <Heart className="w-8 h-8 text-rose-500/60 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("contacts.form.noEmergencyContactsYet")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {emergencyContacts.map((em, idx) => {
              const pickerError = getListItemError(
                "emergency",
                "contactId",
                idx,
              );

              return (
                <motion.div
                  key={getLocalId("emergency", idx)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ zIndex: 100 - idx }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-rose-500/60 transition-colors group-hover:bg-rose-500" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-rose-500/70 group-hover:text-rose-500 transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.contact")} {idx + 1}
                      </span>
                    </div>
                    <CardRemoveButton
                      onClick={() => removeEmergency(idx)}
                      label={t("contacts.form.removeEmergencyContact", { index: idx + 1 })}
                    />
                  </div>

                  <div className="space-y-3">
                    <ContactPicker
                      label={t("contacts.form.linkContact")}
                      value={em.contactId ?? null}
                      onChange={(id) => {
                        updateEmergency(idx, {
                          contactId: id != null ? String(id) : "",
                        });
                      }}
                      excludeIds={excludeIds(idx)}
                      allowCreate={false}
                      searchPlaceholder={t("contacts.form.searchByName")}
                      emptyTitle={t("contacts.form.noContactsFound")}
                    />
                    {pickerError && (
                      <p className="text-[10px] text-destructive mt-0.5 font-medium">
                        {pickerError}
                      </p>
                    )}

                    <Field label={t("contacts.form.relationshipType")}>
                      <EditableSelect
                        options={
                          relationshipOptions.length > 0
                            ? relationshipOptions
                            : RELATIONSHIPS
                        }
                        value={em.relationship || "Father"}
                        onChange={(val) =>
                          updateEmergency(idx, { relationship: val })
                        }
                        className="w-full"
                      />
                    </Field>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={addEmergency}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addEmergencyContact")}</span>
        </Button>
      </div>
    );
  };

  const renderActiveTabContent = () => {
    switch (tab) {
      case "basic":
        return renderBasic();
      case "phones":
        return renderPhones();
      case "emails":
        return renderEmails();
      case "addresses":
        return renderAddresses();
      case "socials":
        return renderSocials();
      case "emergency":
        return renderEmergency();
      default:
        return renderBasic();
    }
  };

  const footerStart = contactDraft.firstName ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {contactDraft.name || contactDraft.firstName}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
          {contactDraft.phones?.length || 0} {t("contacts.form.phonesLabel")}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 text-[10px]">
          {contactDraft.emails?.length || 0} {t("contacts.form.emailsLabel")}
        </span>
        {contactDraft.emergencyContacts &&
          contactDraft.emergencyContacts.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 text-[10px]">
              {contactDraft.emergencyContacts.length}{" "}
              {t("contacts.detail.emergency")}
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
      title={
        contact ? t("contacts.form.editTitle") : t("contacts.form.addTitle")
      }
      subtitle={
        contact
          ? t("contacts.form.editing", { name: contact.name || "" })
          : t("contacts.form.createNewContact")
      }
      icon={User}
      tall
      tabs={visibleTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="contact-form-tab"
      lang={language}
      cancelLabel={t("common.cancel") || "Cancel"}
      saveLabel={t("contacts.form.saveContact") || "Save"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!contactDraft.firstName?.trim()}
      footerStart={footerStart}
    >
      {renderActiveTabContent()}
    </FormModal>
  );
}

