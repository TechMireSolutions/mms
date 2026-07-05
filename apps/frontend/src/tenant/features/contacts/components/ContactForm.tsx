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
  Calendar,
  FileText,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  Contact,
  PhoneNumber,
  EmailAddress,
  Address,
  SocialLink,
  EmergencyContact,
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
  { key: "basic", label: "Basic Info", icon: User },
  { key: "phones", label: "Phones", icon: Phone },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "socials", label: "Socials", icon: Share2 },
  { key: "emergency", label: "Emergency", icon: Heart },
] as const;

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
}: ContactFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const {
    enabledTabIds,
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

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() => {
    const initial: Partial<Contact> = {
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
      ...contact,
    };

    // Format phones to ensure they are normalized properly at init
    if (initial.phones) {
      initial.phones = initial.phones.map((phone) => {
        if (phone.countryCode) return phone;
        const parsed = parsePhoneNumber(phone.number || "", "+92", [
          "+92",
          "+1",
          "+44",
        ]);
        return {
          ...phone,
          countryCode: parsed.countryCode,
          number: parsed.number,
        };
      });
    }

    return initial;
  });

  const visibleTabs = useMemo(() => {
    return CONTACT_TABS.filter((tabItem) => {
      if (tabItem.key === "basic") return true;
      return enabledTabIds.has(tabItem.key);
    });
  }, [enabledTabIds]);

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

    let parsed;
    const trimmedNumber = phone.number.trim();
    if (trimmedNumber.startsWith("+") || trimmedNumber.startsWith("00")) {
      parsed = parsePhoneNumber(trimmedNumber, phone.countryCode || "+92", [
        "+92",
        "+1",
        "+44",
      ]);
    } else {
      const e164 = normalizeToE164(phone.countryCode || "+92", phone.number);
      parsed = parsePhoneNumber(e164, phone.countryCode || "+92", [
        "+92",
        "+1",
        "+44",
      ]);
    }

    const updatedPhones = [...(contactDraft.phones || [])];
    updatedPhones[index] = {
      ...phone,
      countryCode: parsed.countryCode,
      number: parsed.number,
    };
    updateDraft({ phones: updatedPhones });
  };

  const handleSave = () => {
    setValidationErrors([]);
    const formErrors = validate(contactDraft);

    // Custom Pakistani CNIC validation (13 digits)
    if (contactDraft.cnic) {
      const cleanCnic = contactDraft.cnic.replace(/\D/g, "");
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
      const firstName = toTitleCase((contactDraft.firstName || "").trim());
      const lastName = toTitleCase((contactDraft.lastName || "").trim());

      const normalizedPhones = (contactDraft.phones || []).map((phone) => {
        const trimmedNumber = (phone.number || "").trim();
        let parsed;
        if (trimmedNumber.startsWith("+") || trimmedNumber.startsWith("00")) {
          parsed = parsePhoneNumber(trimmedNumber, phone.countryCode || "+92", [
            "+92",
            "+1",
            "+44",
          ]);
        } else {
          const e164 = normalizeToE164(
            phone.countryCode || "+92",
            phone.number,
          );
          parsed = parsePhoneNumber(e164, phone.countryCode || "+92", [
            "+92",
            "+1",
            "+44",
          ]);
        }
        return {
          ...phone,
          countryCode: parsed.countryCode,
          number: parsed.number,
        };
      });

      const contactRaw: Contact = {
        ...contactDraft,
        id: contactDraft.id || contact?.id || crypto.randomUUID(),
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" "),
        phones: normalizedPhones,
        updatedAt: new Date().toISOString().slice(0, 10),
        createdAt:
          contactDraft.createdAt || new Date().toISOString().slice(0, 10),
      } as Contact;

      const finalized = applyTitleCaseToContact(contactRaw) as Contact;

      onSave(finalized);
      notify.success(
        contact
          ? t("contacts.form.contactUpdated")
          : t("contacts.form.contactCreated"),
      );
      onClose();
    } catch (err: any) {
      notify.error(t("settings.serverSaveFailed"), {
        description: err.message,
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
                    {getInitials(
                      contactDraft.name ||
                        `${contactDraft.firstName || ""} ${contactDraft.lastName || ""}`.trim(),
                    )}
                  </span>
                )}

                <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white gap-1 rounded-full">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("account.changePhoto") || "Change"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
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
              id="gender"
            >
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
            </Field>
          )}

          {isFieldEnabled("basic", "dob") && (
            <Field
              label={t("contacts.reportFields.dob")}
              error={getFieldError("dob")}
              id="dob"
            >
              <div className="relative flex items-center group/input">
                <Calendar className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  type="date"
                  value={contactDraft.dob || ""}
                  onChange={(e) => updateDraft({ dob: e.target.value })}
                  className="pl-10"
                />
              </div>
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
          title={t("teachers.field.notes") || "Notes"}
          icon={FileText}
          accentColor="amber"
        >
          <Field
            label={t("teachers.field.notes")}
            id="notes"
            error={getFieldError("notes")}
          >
            <Textarea
              value={(contactDraft.notes as string) || ""}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder={t("teachers.field.notes")}
              className="min-h-[88px] resize-y"
            />
          </Field>
        </SectionCard>
      )}
    </div>
  );

  const renderPhones = () => {
    const phones = contactDraft.phones || [];
    const addPhone = () =>
      updateDraft({
        phones: [
          ...phones,
          { label: "Mobile", number: "", countryCode: "+92" },
        ],
      });
    const removePhone = (idx: number) =>
      updateDraft({ phones: phones.filter((_, i) => i !== idx) });
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
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
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
                      label="Remove Phone"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-24 flex-shrink-0 relative flex items-center group/input">
                      <span className="absolute left-3.5 text-xs text-muted-foreground/60 font-semibold select-none pointer-events-none">
                        cc
                      </span>
                      <Input
                        value={phone.countryCode || "+92"}
                        onChange={(e) =>
                          updatePhone(idx, { countryCode: e.target.value })
                        }
                        onBlur={() => handlePhoneBlur(idx)}
                        placeholder="+92"
                        className="pl-9 font-medium"
                      />
                    </div>
                    <div className="flex-1 relative flex items-center group/input">
                      <Phone className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                      <Input
                        value={phone.number || ""}
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
    const removeEmail = (idx: number) =>
      updateDraft({ emails: emails.filter((_, i) => i !== idx) });
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
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500/60 transition-colors group-hover:bg-amber-500" />
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
                      label="Remove Email"
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
    const removeAddress = (idx: number) =>
      updateDraft({ addresses: addresses.filter((_, i) => i !== idx) });
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
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500" />
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
                      label="Remove Address"
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
    const removeSocial = (idx: number) =>
      updateDraft({ socials: socials.filter((_, i) => i !== idx) });
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
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500/60 transition-colors group-hover:bg-indigo-500" />
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
                      label="Remove Social"
                    />
                  </div>

                  <div className="relative flex items-center group/input">
                    <Share2 className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      value={soc.url || ""}
                      onChange={(e) =>
                        updateSocial(idx, { url: e.target.value })
                      }
                      placeholder="Username, Handle or Link URL"
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
    const removeEmergency = (idx: number) =>
      updateDraft({
        emergencyContacts: emergencyContacts.filter((_, i) => i !== idx),
      });
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
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500/60 transition-colors group-hover:bg-rose-500" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-rose-500/70 group-hover:text-rose-500 transition-colors" />
                      <span className="text-xs font-semibold text-foreground/80">
                        {t("contacts.form.contact")} {idx + 1}
                      </span>
                    </div>
                    <CardRemoveButton
                      onClick={() => removeEmergency(idx)}
                      label="Remove Emergency Contact"
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
                      hasPhone={true}
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
                            : [
                                "Father",
                                "Mother",
                                "Guardian",
                                "Spouse",
                                "Sibling",
                                "Uncle",
                                "Aunt",
                                "Other",
                              ]
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
        return null;
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

function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)} ${digits.slice(5, 12)} ${digits.slice(12)}`;
}
