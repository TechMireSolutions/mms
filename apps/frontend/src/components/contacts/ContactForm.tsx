import React, { useState, useCallback } from "react";
import { User, Phone, Mail, MapPin, Share2, Heart, Users, Plus } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import {
  toTitleCase,
  applyTitleCaseToContact,
  normalizeToE164,
  parsePhoneNumber,
  Contact,
  PhoneNumber,
  EmailAddress,
  Address,
  SocialLink,
  EmergencyContact,
  ContactRelationship,
} from "@mms/shared";
import {
  Field,
  CardTypeLabel,
  CardRemoveButton,
  EditableSelect,
  COLLECTION_CARD,
  TYPE_SELECT_WIDTH,
} from "@/components/ui/FormPrimitives";

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
  { key: "relationships", label: "Relationships", icon: Users },
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

  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() => {
    const initial: Partial<Contact> = {
      firstName: "",
      lastName: "",
      name: "",
      gender: "Unspecified",
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
        const parsed = parsePhoneNumber(phone.number || "", "+92", ["+92", "+1", "+44"]);
        return {
          ...phone,
          countryCode: parsed.countryCode,
          number: parsed.number,
        };
      });
    }

    return initial;
  });

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

  const handlePhoneBlur = (index: number) => {
    const phone = (contactDraft.phones || [])[index];
    if (!phone || !phone.number) return;

    let parsed;
    const trimmedNumber = phone.number.trim();
    if (trimmedNumber.startsWith("+") || trimmedNumber.startsWith("00")) {
      parsed = parsePhoneNumber(trimmedNumber, phone.countryCode || "+92", ["+92", "+1", "+44"]);
    } else {
      const e164 = normalizeToE164(phone.countryCode || "+92", phone.number);
      parsed = parsePhoneNumber(e164, phone.countryCode || "+92", ["+92", "+1", "+44"]);
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
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!contactDraft.firstName?.trim()) {
      newErrors.firstName = t("contacts.form.firstNameRequired") || "First name is required";
    }

    if (contactDraft.cnic) {
      const cleanCnic = contactDraft.cnic.replace(/\D/g, "");
      if (cleanCnic.length > 0 && cleanCnic.length !== 13) {
        newErrors.cnic = t("contacts.form.cnicInvalid") || "CNIC must be in the format 99999 9999999 9";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTab("basic");
      notify.error(t("contacts.form.pleaseFixErrors") || "Please fix validation errors");
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
          parsed = parsePhoneNumber(trimmedNumber, phone.countryCode || "+92", ["+92", "+1", "+44"]);
        } else {
          const e164 = normalizeToE164(phone.countryCode || "+92", phone.number);
          parsed = parsePhoneNumber(e164, phone.countryCode || "+92", ["+92", "+1", "+44"]);
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
        createdAt: contactDraft.createdAt || new Date().toISOString().slice(0, 10),
      } as Contact;

      const finalized = applyTitleCaseToContact(contactRaw) as Contact;

      onSave(finalized);
      notify.success(
        contact ? t("contacts.form.contactUpdated") : t("contacts.form.contactCreated")
      );
      onClose();
    } catch (err: any) {
      notify.error(t("settings.serverSaveFailed"), { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Tab sub-renders
  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <Field label={t("contacts.reportFields.firstName")} required error={errors.firstName} id="firstName">
        <Input
          value={contactDraft.firstName || ""}
          onChange={(e) => updateDraft({ firstName: e.target.value })}
          placeholder={t("contacts.reportFields.firstName")}
          className="min-h-[44px]"
        />
      </Field>

      <Field label={t("contacts.reportFields.lastName")} id="lastName">
        <Input
          value={contactDraft.lastName || ""}
          onChange={(e) => updateDraft({ lastName: e.target.value })}
          placeholder={t("contacts.reportFields.lastName")}
          className="min-h-[44px]"
        />
      </Field>

      <Field label={t("contacts.reportFields.gender")} id="gender">
        <EditableSelect
          options={["Male", "Female", "Other", "Unspecified"]}
          value={contactDraft.gender || "Unspecified"}
          onChange={(val) => updateDraft({ gender: val })}
          placeholder={t("contacts.form.selectOption")}
          className="w-full"
        />
      </Field>

      <Field label={t("contacts.reportFields.dob")} id="dob">
        <Input
          type="date"
          value={contactDraft.dob || ""}
          onChange={(e) => updateDraft({ dob: e.target.value })}
          className="min-h-[44px]"
        />
      </Field>

      <Field label={t("contacts.form.cnic") || "CNIC"} id="cnic" error={errors.cnic}>
        <Input
          value={contactDraft.cnic || ""}
          onChange={(e) => {
            const formatted = formatCnic(e.target.value);
            updateDraft({ cnic: formatted });
          }}
          placeholder={t("contacts.form.cnicPlaceholder") || "99999 9999999 9"}
          className="min-h-[44px]"
        />
      </Field>

      <div className="flex items-center gap-2.5 py-1">
        <Checkbox
          id="isSyed"
          checked={!!contactDraft.isSyed}
          onCheckedChange={(checked) => updateDraft({ isSyed: !!checked })}
        />
        <label htmlFor="isSyed" className="text-xs font-semibold select-none cursor-pointer">
          {t("contacts.reportFields.isSyed")}
        </label>
      </div>

      <Field label={t("teachers.field.notes")} id="notes">
        <textarea
          value={(contactDraft.notes as string) || ""}
          onChange={(e) => updateDraft({ notes: e.target.value })}
          placeholder={t("teachers.field.notes")}
          className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
        />
      </Field>
    </div>
  );

  const renderPhones = () => {
    const phones = contactDraft.phones || [];
    const addPhone = () => updateDraft({ phones: [...phones, { label: "Mobile", number: "", countryCode: "+92" }] });
    const removePhone = (idx: number) => updateDraft({ phones: phones.filter((_, i) => i !== idx) });
    const updatePhone = (idx: number, patch: Partial<PhoneNumber>) => {
      updateDraft({ phones: phones.map((p, i) => (i === idx ? { ...p, ...patch } : p)) });
    };

    return (
      <div className="space-y-3 text-left">
        {phones.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <Phone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noPhoneNumbersYet")}</p>
          </div>
        )}

        {phones.map((phone, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={["Mobile", "Home", "Work", "WhatsApp", "Other"]}
                  value={phone.label || "Mobile"}
                  onChange={(val) => updatePhone(idx, { label: val })}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
              <CardRemoveButton onClick={() => removePhone(idx)} label="Remove Phone" />
            </div>

            <div className="flex gap-2">
              <div className="w-20 flex-shrink-0">
                <Input
                  value={phone.countryCode || "+92"}
                  onChange={(e) => updatePhone(idx, { countryCode: e.target.value })}
                  onBlur={() => handlePhoneBlur(idx)}
                  placeholder="+92"
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={phone.number || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const trimmed = val.trim();
                    if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
                      if (trimmed.length > 6) {
                        const parsed = parsePhoneNumber(val, phone.countryCode || "+92", ["+92", "+1", "+44"]);
                        updatePhone(idx, { countryCode: parsed.countryCode, number: parsed.number });
                        return;
                      }
                    }
                    updatePhone(idx, { number: val });
                  }}
                  onBlur={() => handlePhoneBlur(idx)}
                  placeholder={t("contacts.form.phoneNumberPlaceholder")}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addPhone}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addPhoneNumber")}</span>
        </Button>
      </div>
    );
  };

  const renderEmails = () => {
    const emails = contactDraft.emails || [];
    const addEmail = () => updateDraft({ emails: [...emails, { label: "Personal", address: "" }] });
    const removeEmail = (idx: number) => updateDraft({ emails: emails.filter((_, i) => i !== idx) });
    const updateEmail = (idx: number, patch: Partial<EmailAddress>) => {
      updateDraft({ emails: emails.map((e, i) => (i === idx ? { ...e, ...patch } : e)) });
    };

    return (
      <div className="space-y-3 text-left">
        {emails.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noEmailAddressesYet")}</p>
          </div>
        )}

        {emails.map((email, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={["Personal", "Work", "Other"]}
                  value={email.label || "Personal"}
                  onChange={(val) => updateEmail(idx, { label: val })}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
              <CardRemoveButton onClick={() => removeEmail(idx)} label="Remove Email" />
            </div>

            <Input
              type="email"
              value={email.address || ""}
              onChange={(e) => updateEmail(idx, { address: e.target.value })}
              placeholder={t("auth.emailAddress")}
              className="min-h-[44px]"
            />
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addEmail}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
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
          { label: "Home", line1: "", city: defaultCity, state: defaultProvince, country: defaultCountry },
        ],
      });
    const removeAddress = (idx: number) => updateDraft({ addresses: addresses.filter((_, i) => i !== idx) });
    const updateAddress = (idx: number, patch: Partial<Address>) => {
      updateDraft({ addresses: addresses.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });
    };

    return (
      <div className="space-y-3 text-left">
        {addresses.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noAddressesYet")}</p>
          </div>
        )}

        {addresses.map((addr, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={["Home", "Work", "Billing", "Other"]}
                  value={addr.label || "Home"}
                  onChange={(val) => updateAddress(idx, { label: val })}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
              <CardRemoveButton onClick={() => removeAddress(idx)} label="Remove Address" />
            </div>

            <div className="space-y-2">
              <Input
                value={addr.line1 || ""}
                onChange={(e) => updateAddress(idx, { line1: e.target.value })}
                placeholder={t("contacts.reportFields.streetAddress")}
                className="min-h-[44px]"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={addr.city || ""}
                  onChange={(e) => updateAddress(idx, { city: e.target.value })}
                  placeholder={t("contacts.reportFields.city")}
                  className="min-h-[44px]"
                />
                <Input
                  value={addr.state || ""}
                  onChange={(e) => updateAddress(idx, { state: e.target.value })}
                  placeholder={t("contacts.reportFields.state")}
                  className="min-h-[44px]"
                />
                <Input
                  value={addr.country || ""}
                  onChange={(e) => updateAddress(idx, { country: e.target.value })}
                  placeholder={t("contacts.reportFields.country")}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addAddress}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addAddress")}</span>
        </Button>
      </div>
    );
  };

  const renderSocials = () => {
    const socials = contactDraft.socials || [];
    const addSocial = () => updateDraft({ socials: [...socials, { platform: "WhatsApp", url: "" }] });
    const removeSocial = (idx: number) => updateDraft({ socials: socials.filter((_, i) => i !== idx) });
    const updateSocial = (idx: number, patch: Partial<SocialLink>) => {
      updateDraft({ socials: socials.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
    };

    return (
      <div className="space-y-3 text-left">
        {socials.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noSocialLinksYet")}</p>
          </div>
        )}

        {socials.map((soc, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={["WhatsApp", "Facebook", "Twitter/X", "LinkedIn", "Instagram", "YouTube", "Other"]}
                  value={soc.platform || "WhatsApp"}
                  onChange={(val) => updateSocial(idx, { platform: val })}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
              <CardRemoveButton onClick={() => removeSocial(idx)} label="Remove Social" />
            </div>

            <Input
              value={soc.url || ""}
              onChange={(e) => updateSocial(idx, { url: e.target.value })}
              placeholder="Username, Handle or Link URL"
              className="min-h-[44px]"
            />
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addSocial}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
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
        emergencyContacts: [...emergencyContacts, { name: "", relationship: "Father", phone: "", contactId: "" }],
      });
    const removeEmergency = (idx: number) =>
      updateDraft({ emergencyContacts: emergencyContacts.filter((_, i) => i !== idx) });
    const updateEmergency = (idx: number, patch: Partial<EmergencyContact>) => {
      updateDraft({
        emergencyContacts: emergencyContacts.map((em, i) => (i === idx ? { ...em, ...patch } : em)),
      });
    };
    const excludeIds = (idx: number): (string | number)[] => {
      const linked = emergencyContacts
        .filter((_, i) => i !== idx)
        .map((em) => em.contactId)
        .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
      if (contactDraft.id != null) linked.unshift(contactDraft.id);
      return linked;
    };

    return (
      <div className="space-y-3 text-left">
        {emergencyContacts.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <Heart className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noEmergencyContactsYet")}</p>
          </div>
        )}

        {emergencyContacts.map((em, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t("contacts.form.contact")} {idx + 1}</span>
              <CardRemoveButton onClick={() => removeEmergency(idx)} label="Remove Emergency Contact" />
            </div>

            <div className="space-y-3">
              <ContactPicker
                label={t("contacts.form.linkContact")}
                value={em.contactId ?? null}
                onChange={(id) => updateEmergency(idx, { contactId: id != null ? String(id) : "" })}
                excludeIds={excludeIds(idx)}
                allowCreate={false}
                searchPlaceholder={t("contacts.form.searchByName")}
                emptyTitle={t("contacts.form.noContactsFound")}
              />

              <Field label={t("contacts.form.relationshipType")}>
                <EditableSelect
                  options={["Father", "Mother", "Guardian", "Spouse", "Sibling", "Uncle", "Aunt", "Other"]}
                  value={em.relationship || "Father"}
                  onChange={(val) => updateEmergency(idx, { relationship: val })}
                  className="w-full"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label={t("contacts.reportFields.fullName")}>
                  <Input
                    value={em.name || ""}
                    onChange={(e) => updateEmergency(idx, { name: e.target.value })}
                    placeholder="Emergency Contact Name"
                    className="min-h-[44px]"
                  />
                </Field>
                <Field label={t("contacts.form.phoneNumber")}>
                  <Input
                    value={em.phone || ""}
                    onChange={(e) => updateEmergency(idx, { phone: e.target.value })}
                    placeholder="Emergency Contact Phone"
                    className="min-h-[44px]"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addEmergency}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addEmergencyContact")}</span>
        </Button>
      </div>
    );
  };

  const renderRelationships = () => {
    const relationships = contactDraft.relationships || [];
    const addRelationship = () => updateDraft({ relationships: [...relationships, { contactId: "", relationship: "Father" }] });
    const removeRelationship = (idx: number) =>
      updateDraft({ relationships: relationships.filter((_, i) => i !== idx) });
    const updateRelationship = (idx: number, patch: Partial<ContactRelationship>) => {
      updateDraft({
        relationships: relationships.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
      });
    };
    const excludeIds = (idx: number): (string | number)[] => {
      const linked = relationships
        .filter((_, i) => i !== idx)
        .map((r) => r.contactId)
        .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
      if (contactDraft.id != null) linked.unshift(contactDraft.id);
      return linked;
    };

    return (
      <div className="space-y-3 text-left">
        {relationships.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("contacts.form.noRelationshipsSet")}</p>
          </div>
        )}

        {relationships.map((rel, idx) => (
          <div key={idx} className={COLLECTION_CARD}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t("contacts.form.link")} {idx + 1}</span>
              <CardRemoveButton onClick={() => removeRelationship(idx)} label="Remove Relationship" />
            </div>

            <div className="space-y-3">
              <ContactPicker
                label={t("contacts.form.linkContact")}
                value={rel.contactId ?? null}
                onChange={(id) => updateRelationship(idx, { contactId: id != null ? String(id) : "" })}
                excludeIds={excludeIds(idx)}
                allowCreate={false}
                searchPlaceholder={t("contacts.form.searchByName")}
                emptyTitle={t("contacts.form.noContactsFound")}
              />

              <Field label={t("contacts.form.relationshipType")}>
                <EditableSelect
                  options={["Father", "Mother", "Guardian", "Spouse", "Sibling", "Uncle", "Aunt", "Other"]}
                  value={rel.relationship || "Father"}
                  onChange={(val) => updateRelationship(idx, { relationship: val })}
                  className="w-full"
                />
              </Field>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addRelationship}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
        >
          <Plus className="w-4 h-4" />
          <span>{t("contacts.form.addRelationshipLink")}</span>
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
      case "relationships":
        return renderRelationships();
      default:
        return null;
    }
  };

  const footerStart = contactDraft.firstName ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{contactDraft.name || contactDraft.firstName}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>
          {contactDraft.phones?.length || 0} {t("contacts.form.phonesLabel")}
        </span>
        <span className="border-s border-border ps-2">
          {contactDraft.emails?.length || 0} {t("contacts.form.emailsLabel")}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">{t("contacts.form.firstNameRequired")}</span>
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
      tabs={CONTACT_TABS}
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
