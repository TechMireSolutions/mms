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
import { getFallbackCountryCode, formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import {
  useContactConfig,
  useContactValidation,
  ValidationError,
} from "@/lib/contexts/ContactConfigContext";
import {
  toTitleCase,
  applyTitleCaseToContact,
  parsePhoneNumber,
  getDisplayName,
  Contact,
  PhoneNumber,
  EmailAddress,
  Address,
  SocialLink,
  EmergencyContact,
  RELATIONSHIPS,
  GENDERS,
  DEFAULT_PHONE_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_SOCIAL_PLATFORMS,
  todayISO,
  formatCnic,
  cleanContactDraft,
  normalizeContactForEdit,
  syncContactScalarFields,
} from "@mms/shared";
import {
  Field,
  CardRemoveButton,
  EditableSelect,
  TYPE_SELECT_WIDTH,
} from "@/components/ui/FormPrimitives";
import { FORM_CARD } from "@/components/ui/formStyles";
import { SectionCard } from "@/components/ui/SectionCard";

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
  { key: "basic", labelKey: "contacts.form.tabBasic", icon: User },
  { key: "phones", labelKey: "contacts.form.tabPhones", icon: Phone },
  { key: "emails", labelKey: "contacts.form.tabEmails", icon: Mail },
  { key: "addresses", labelKey: "contacts.form.tabAddresses", icon: MapPin },
  { key: "socials", labelKey: "contacts.form.tabSocials", icon: Share2 },
  { key: "emergency", labelKey: "contacts.form.tabEmergency", icon: Heart },
] as const;

type TabKey = (typeof CONTACT_TABS)[number]["key"];

interface ListFieldCardProps {
  id: string;
  index: number;
  icon: React.ElementType;
  accentClass?: string;
  iconClass?: string;
  label: string;
  typeSelect?: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}

function ListFieldCard({
  id,
  index,
  icon: Icon,
  accentClass = "bg-primary/60 group-hover:bg-primary",
  iconClass = "text-primary/70 group-hover:text-primary",
  label,
  typeSelect,
  onRemove,
  removeLabel,
  children,
}: ListFieldCardProps): React.JSX.Element {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ zIndex: 100 - index }}
      className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
    >
      <div className={cn("absolute start-0 top-0 bottom-0 w-1.5 transition-colors", accentClass)} />
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-4 h-4 transition-colors", iconClass)} />
          <span className="text-xs font-semibold text-foreground/80">
            {label}
          </span>
          {typeSelect}
        </div>
        <CardRemoveButton onClick={onRemove} label={removeLabel} />
      </div>
      {children}
    </motion.div>
  );
}

interface EmptyListCardProps {
  icon: React.ElementType;
  message: string;
}

function EmptyListCard({ icon: Icon, message }: EmptyListCardProps): React.JSX.Element {
  return (
    <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-muted/5 backdrop-blur-sm">
      <Icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
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
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const getLocalId = (tabName: string, idx: number): string => `${formInstanceId}-${tabName}-${idx}`;

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
  );

  // Re-sync draft when editing another contact or re-opening modal
  React.useEffect(() => {
    if (!open) return;
    setTab("basic");
    setContactDraft(
      normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
    );
    setValidationErrors([]);
  }, [open, contact, initialDraft, defaultCity, defaultProvince, defaultCountry]);

  const visibleTabs = useMemo(() => {
    const phoneCount = (contactDraft.phones || []).filter(phone => (phone.number || "").trim()).length;
    const emailCount = (contactDraft.emails || []).filter(email => (email.address || "").trim()).length;
    const addressCount = (contactDraft.addresses || []).filter(address => (address.line1 || address.city || "").trim()).length;
    const socialCount = (contactDraft.socials || []).filter(social => (social.url || "").trim()).length;
    const emergencyCount = (contactDraft.emergencyContacts || []).filter(emergency => emergency.contactId).length;

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
        key: tabItem.key,
        icon: tabItem.icon,
        label: t(tabItem.labelKey),
        badge: count && count > 0 ? count : undefined,
      };
    });
  }, [contactDraft.phones, contactDraft.emails, contactDraft.addresses, contactDraft.socials, contactDraft.emergencyContacts, t]);

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
    setContactDraft((prev) => {
      const currentPhones = prev.phones || [];
      const phone = currentPhones[index];
      if (!phone || !phone.number) return prev;
      const { countryCode, formattedNumber: number } = formatContactPhoneDisplay(phone.number, phone.countryCode || defaultCountryCode);
      const updatedPhones = [...currentPhones];
      updatedPhones[index] = { ...phone, countryCode, number };
      return {
        ...prev,
        phones: updatedPhones,
      };
    });
  };

  type SubListKey = "phones" | "emails" | "addresses" | "socials" | "emergencyContacts";

  const addSubListItem = useCallback(<K extends SubListKey>(
    fieldKey: K,
    newItem: NonNullable<Contact[K]>[number]
  ) => {
    setContactDraft((prev) => ({
      ...prev,
      [fieldKey]: [...((prev[fieldKey] as unknown[]) || []), newItem],
    }));
  }, []);

  const updateSubListItem = useCallback(<K extends SubListKey>(
    fieldKey: K,
    idx: number,
    patch: Partial<NonNullable<Contact[K]>[number]>
  ) => {
    setContactDraft((prev) => {
      const list = ((prev[fieldKey] as unknown[]) || []) as Record<string, unknown>[];
      const nextList = list.map((item, i) => (i === idx ? { ...item, ...patch } : item));
      return { ...prev, [fieldKey]: nextList };
    });
  }, []);

  const removeSubListItem = useCallback((fieldKey: SubListKey, idx: number) => {
    setContactDraft((prev) => {
      const list = (prev[fieldKey] as unknown[]) || [];
      return {
        ...prev,
        [fieldKey]: list.filter((_, i) => i !== idx),
      };
    });
  }, []);

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
      // Normalize and format data
      const firstName = toTitleCase((cleanedDraft.firstName || "").trim());
      const lastName = toTitleCase((cleanedDraft.lastName || "").trim());

      const normalizedPhones = (cleanedDraft.phones || []).map((phone) => {
        const { countryCode, formattedNumber: number } = formatContactPhoneDisplay(phone.number, phone.countryCode || defaultCountryCode);
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
        createdAt:
          cleanedDraft.createdAt || todayISO(),
      } as Contact;

      const titleCased = applyTitleCaseToContact(contactRaw) as Contact;
      const finalized = syncContactScalarFields(titleCased);

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
        title={t("contacts.form.createNewContact")}
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
                <UserAvatar
                  id={contactDraft.id}
                  name={getDisplayName(contactDraft)}
                  avatar={contactDraft.avatar}
                  className="w-full h-full text-2xl"
                />

                <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white gap-1 rounded-full">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("account.changePhoto")}
                  </span>
                  <input
                    id="contact-avatar-file-input"
                    name="avatarFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    aria-label={t("account.changePhoto")}
                  />
                </label>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {contactDraft.name || t("contacts.form.createNewContact")}
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
                    {t("contacts.reportFields.isSyed")}
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
              id={`cf-${formInstanceId}-firstName`}
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-firstName`}
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
              id={`cf-${formInstanceId}-lastName`}
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-lastName`}
                  name="lastName"
                  value={contactDraft.lastName || ""}
                  onChange={(e) => updateDraft({ lastName: e.target.value })}
                  placeholder={t("contacts.reportFields.lastName")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "gender") && (
            <Field
              label={t("contacts.reportFields.gender")}
              error={getFieldError("gender")}
              id={`cf-${formInstanceId}-gender`}
            >
              {lockGender ? (
                <div className="flex h-10 w-full items-center rounded-xl border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground select-none font-semibold">
                  {toTitleCase(contactDraft.gender || "unspecified")}
                </div>
              ) : (
                <EditableSelect
                  id={`cf-${formInstanceId}-gender`}
                  options={
                    genders.length > 0
                      ? genders
                      : GENDERS
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
              id={`cf-${formInstanceId}-dob`}
            >
              <DatePicker
                id={`cf-${formInstanceId}-dob`}
                name="dob"
                value={contactDraft.dob || undefined}
                onChange={(dateStr) => updateDraft({ dob: dateStr })}
              />
            </Field>
          )}

          {isFieldEnabled("basic", "cnic") && (
            <Field
              label={t("contacts.form.cnic")}
              id={`cf-${formInstanceId}-cnic`}
              error={getFieldError("cnic")}
            >
              <div className="relative flex items-center group/input">
                <FileText className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-cnic`}
                  name="cnic"
                  value={contactDraft.cnic || ""}
                  onChange={(e) => {
                    const formatted = formatCnic(e.target.value);
                    updateDraft({ cnic: formatted });
                  }}
                  placeholder={t("contacts.form.cnicPlaceholder")}
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
          title={t("contacts.form.notes")}
          icon={FileText}
          accentColor="amber"
        >
          <Field
            label={t("contacts.form.notes")}
            id={`cf-${formInstanceId}-notes`}
            error={getFieldError("notes")}
          >
            <Textarea
              id={`cf-${formInstanceId}-notes`}
              name="notes"
              value={(contactDraft.notes as string) || ""}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder={t("contacts.form.notesPlaceholder")}
              className="min-h-[88px] resize-y"
            />
          </Field>
        </SectionCard>
      )}
    </div>
  );

  const renderPhones = () => {
    const phones = contactDraft.phones || [];
    const addPhone = () => {
      addSubListItem("phones", { label: "Mobile", number: "", countryCode: defaultCountryCode });
    };
    const removePhone = (idx: number) => removeSubListItem("phones", idx);
    const updatePhone = (idx: number, patch: Partial<PhoneNumber>) => updateSubListItem("phones", idx, patch);

    return (
      <div className="space-y-3 text-left">
        {phones.length === 0 && (
          <EmptyListCard icon={Phone} message={t("contacts.form.noPhoneNumbersYet")} />
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {phones.map((phone, idx) => {
              const numError = getListItemError("phones", "number", idx);
              return (
                <ListFieldCard
                  key={getLocalId("phones", idx)}
                  id={getLocalId("phones", idx)}
                  index={idx}
                  icon={Phone}
                  accentClass="bg-primary/60 group-hover:bg-primary"
                  iconClass="text-primary/70 group-hover:text-primary"
                  label={`${t("contacts.form.type")}:`}
                  typeSelect={
                    <EditableSelect
                      options={
                        phoneLabels.length > 0
                          ? phoneLabels
                          : DEFAULT_PHONE_LABELS
                      }
                      value={phone.label || "Mobile"}
                      onChange={(val) => updatePhone(idx, { label: val })}
                      className={TYPE_SELECT_WIDTH}
                      id={`phone-label-${idx}`}
                      name={`phone-label-${idx}`}
                    />
                  }
                  onRemove={() => removePhone(idx)}
                  removeLabel={t("contacts.form.removePhoneNumber", { index: idx + 1 })}
                >
                  <div className="flex items-center gap-2 w-full">
                    <EditableSelect
                      options={countryCodeOptions}
                      value={phone.countryCode || defaultCountryCode}
                      onChange={(val) => updatePhone(idx, { countryCode: val })}
                      className="w-[90px] shrink-0"
                      id={`phone-country-${idx}`}
                      name={`phone-country-${idx}`}
                    />
                    <div className="relative flex items-center group/input flex-1 min-w-0">
                      <Phone className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                      <Input
                        type="tel"
                        id={`phone-number-${idx}`}
                        name={`phone-number-${idx}`}
                        value={phone.number || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const trimmed = val.trim();
                          if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
                            const parsed = parsePhoneNumber(val, phone.countryCode || defaultCountryCode, countryCodeOptions);
                            updatePhone(idx, {
                              countryCode: parsed.countryCode,
                              number: parsed.number,
                            });
                            return;
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
                  </div>
                  {numError && (
                    <p className="text-[10px] text-destructive mt-1 font-medium">
                      {numError}
                    </p>
                  )}
                </ListFieldCard>
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
    const addEmail = () => {
      addSubListItem("emails", { label: "Personal", address: "" });
    };
    const removeEmail = (idx: number) => removeSubListItem("emails", idx);
    const updateEmail = (idx: number, patch: Partial<EmailAddress>) => updateSubListItem("emails", idx, patch);

    return (
      <div className="space-y-3 text-left">
        {emails.length === 0 && (
          <EmptyListCard icon={Mail} message={t("contacts.form.noEmailAddressesYet")} />
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {emails.map((email, idx) => {
              const emailError = getListItemError("emails", "address", idx);
              return (
                <ListFieldCard
                  key={getLocalId("emails", idx)}
                  id={getLocalId("emails", idx)}
                  index={idx}
                  icon={Mail}
                  accentClass="bg-amber-500/60 group-hover:bg-amber-500"
                  iconClass="text-amber-500/70 group-hover:text-amber-500"
                  label={`${t("contacts.form.type")}:`}
                  typeSelect={
                    <EditableSelect
                      options={
                        emailLabels.length > 0
                          ? emailLabels
                          : DEFAULT_EMAIL_LABELS
                      }
                      value={email.label || "Personal"}
                      onChange={(val) => updateEmail(idx, { label: val })}
                      className={TYPE_SELECT_WIDTH}
                      id={`email-label-${idx}`}
                      name={`email-label-${idx}`}
                    />
                  }
                  onRemove={() => removeEmail(idx)}
                  removeLabel={t("contacts.form.removeEmailAddress", { index: idx + 1 })}
                >
                  <div className="relative flex items-center group/input">
                    <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      type="email"
                      id={`email-address-${idx}`}
                      name={`email-address-${idx}`}
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
                </ListFieldCard>
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
    const addAddress = () => {
      addSubListItem("addresses", {
        label: "Home",
        line1: "",
        city: defaultCity,
        state: defaultProvince,
        country: defaultCountry,
      });
    };
    const removeAddress = (idx: number) => removeSubListItem("addresses", idx);
    const updateAddress = (idx: number, patch: Partial<Address>) => updateSubListItem("addresses", idx, patch);

    return (
      <div className="space-y-3 text-left">
        {addresses.length === 0 && (
          <EmptyListCard icon={MapPin} message={t("contacts.form.noAddressesYet")} />
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {addresses.map((addr, idx) => {
              const line1Error = getListItemError("addresses", "line1", idx);
              const cityError = getListItemError("addresses", "city", idx);
              return (
                <ListFieldCard
                  key={getLocalId("addresses", idx)}
                  id={getLocalId("addresses", idx)}
                  index={idx}
                  icon={MapPin}
                  accentClass="bg-emerald-500/60 group-hover:bg-emerald-500"
                  iconClass="text-emerald-500/70 group-hover:text-emerald-500"
                  label={`${t("contacts.form.type")}:`}
                  typeSelect={
                    <EditableSelect
                      options={
                        addressLabels.length > 0
                          ? addressLabels
                          : DEFAULT_ADDRESS_LABELS
                      }
                      value={addr.label || "Home"}
                      onChange={(val) => updateAddress(idx, { label: val })}
                      className={TYPE_SELECT_WIDTH}
                      id={`address-label-${idx}`}
                      name={`address-label-${idx}`}
                    />
                  }
                  onRemove={() => removeAddress(idx)}
                  removeLabel={t("contacts.form.removeAddress", { index: idx + 1 })}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="relative flex items-center group/input">
                        <MapPin className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                        <Input
                          id={`address-line1-${idx}`}
                          name={`address-line1-${idx}`}
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
                          id={`address-city-${idx}`}
                          name={`address-city-${idx}`}
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
                        id={`address-state-${idx}`}
                        name={`address-state-${idx}`}
                        value={addr.state || ""}
                        onChange={(e) =>
                          updateAddress(idx, { state: e.target.value })
                        }
                        placeholder={t("contacts.reportFields.state")}
                      />
                      <Input
                        id={`address-country-${idx}`}
                        name={`address-country-${idx}`}
                        value={addr.country || ""}
                        onChange={(e) =>
                          updateAddress(idx, { country: e.target.value })
                        }
                        placeholder={t("contacts.reportFields.country")}
                      />
                    </div>
                  </div>
                </ListFieldCard>
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
    const addSocial = () => {
      addSubListItem("socials", { platform: "WhatsApp", url: "" });
    };
    const removeSocial = (idx: number) => removeSubListItem("socials", idx);
    const updateSocial = (idx: number, patch: Partial<SocialLink>) => updateSubListItem("socials", idx, patch);

    return (
      <div className="space-y-3 text-left">
        {socials.length === 0 && (
          <EmptyListCard icon={Share2} message={t("contacts.form.noSocialLinksYet")} />
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {socials.map((soc, idx) => {
              const urlError = getListItemError("socials", "url", idx);
              return (
                <ListFieldCard
                  key={getLocalId("socials", idx)}
                  id={getLocalId("socials", idx)}
                  index={idx}
                  icon={Share2}
                  accentClass="bg-indigo-500/60 group-hover:bg-indigo-500"
                  iconClass="text-indigo-500/70 group-hover:text-indigo-500"
                  label={`${t("contacts.form.type")}:`}
                  typeSelect={
                    <EditableSelect
                      options={
                        socialPlatforms.length > 0
                          ? socialPlatforms
                          : DEFAULT_SOCIAL_PLATFORMS
                      }
                      value={soc.platform || "WhatsApp"}
                      onChange={(val) => updateSocial(idx, { platform: val })}
                      className={TYPE_SELECT_WIDTH}
                      id={`social-platform-${idx}`}
                      name={`social-platform-${idx}`}
                    />
                  }
                  onRemove={() => removeSocial(idx)}
                  removeLabel={t("contacts.form.removeSocialLink", { index: idx + 1 })}
                >
                  <div className="relative flex items-center group/input">
                    <Share2 className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      id={`social-url-${idx}`}
                      name={`social-url-${idx}`}
                      value={soc.url || ""}
                      onChange={(e) =>
                        updateSocial(idx, { url: e.target.value })
                      }
                      placeholder={t("contacts.form.socialHandlePlaceholder")}
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
                </ListFieldCard>
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
    const addEmergency = () => {
      addSubListItem("emergencyContacts", { relationship: "Father", contactId: "" });
    };
    const removeEmergency = (idx: number) => removeSubListItem("emergencyContacts", idx);
    const updateEmergency = (idx: number, patch: Partial<EmergencyContact>) => updateSubListItem("emergencyContacts", idx, patch);
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
          <EmptyListCard icon={Heart} message={t("contacts.form.noEmergencyContactsYet")} />
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
                <ListFieldCard
                  key={getLocalId("emergency", idx)}
                  id={getLocalId("emergency", idx)}
                  index={idx}
                  icon={Heart}
                  accentClass="bg-rose-500/60 group-hover:bg-rose-500"
                  iconClass="text-rose-500/70 group-hover:text-rose-500"
                  label={`${t("contacts.form.contact")} ${idx + 1}`}
                  onRemove={() => removeEmergency(idx)}
                  removeLabel={t("contacts.form.removeEmergencyContact", { index: idx + 1 })}
                >
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
                      id={`emergency-contact-${idx}`}
                      name={`emergency-contact-${idx}`}
                    />
                    {pickerError && (
                      <p className="text-[10px] text-destructive mt-0.5 font-medium">
                        {pickerError}
                      </p>
                    )}

                    <Field label={t("contacts.form.relationshipType")} id={`emergency-relationship-${idx}`}>
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
                        id={`emergency-relationship-${idx}`}
                        name={`emergency-relationship-${idx}`}
                      />
                    </Field>
                  </div>
                </ListFieldCard>
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

  const footerCounts = useMemo(() => {
    const filledPhones = (contactDraft.phones || []).filter(p => (p.number || "").trim()).length;
    const filledEmails = (contactDraft.emails || []).filter(e => (e.address || "").trim()).length;
    const filledEmergency = (contactDraft.emergencyContacts || []).filter(e => e.contactId).length;
    return { filledPhones, filledEmails, filledEmergency };
  }, [contactDraft.phones, contactDraft.emails, contactDraft.emergencyContacts]);

  const footerStart = contactDraft.firstName ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {getDisplayName(contactDraft)}
      </span>
      <div className="flex items-center gap-1.5">
        {footerCounts.filledPhones > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
            {footerCounts.filledPhones} {t("contacts.form.phonesLabel")}
          </span>
        )}
        {footerCounts.filledEmails > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 text-[10px]">
            {footerCounts.filledEmails} {t("contacts.form.emailsLabel")}
          </span>
        )}
        {footerCounts.filledEmergency > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 text-[10px]">
            {footerCounts.filledEmergency} {t("contacts.detail.emergency")}
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
      cancelLabel={t("common.cancel")}
      saveLabel={t("contacts.form.saveContact")}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!contactDraft.firstName?.trim()}
      footerStart={footerStart}
    >
      {renderActiveTabContent()}
    </FormModal>
  );
}

