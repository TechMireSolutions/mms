import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { useContactConfig, useContactValidation } from "@/lib/contexts/ContactConfigContext";
import {
  toTitleCase,
  applyTitleCaseToContact,
  Contact,
  todayISO,
  cleanContactDraft,
  normalizeContactForEdit,
  syncContactScalarFields,
  type ValidationError,
} from "@mms/shared";
import type {
  AddSubListItem,
  ContactSubListKey,
  RemoveSubListItem,
  UpdateSubListItem,
} from "@/tenant/features/contacts/components/formTabs/types";

export function useContactFormDraft({
  open,
  contact,
  initialDraft,
  defaultCountry,
  defaultCity,
  defaultProvince,
  onSave,
  onClose,
  onValidationTab,
}: {
  open: boolean;
  contact?: Contact;
  initialDraft?: Partial<Contact>;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  onSave: (contact: Contact) => void | Promise<void>;
  onClose: () => void;
  onValidationTab: (tabId: string) => void;
}) {
  const { t } = useTranslation();
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
    defaultPhoneCountryCode,
  } = useContactConfig();
  const validate = useContactValidation();
  const formInstanceId = contact?.id || "new";
  const defaultCountryCode = defaultPhoneCountryCode;

  const countryCodeOptions = useMemo(() => {
    const list = (countryCodes || []).map((countryItem) => countryItem.code).filter(Boolean);
    return Array.from(new Set([defaultCountryCode, ...list].filter(Boolean)));
  }, [countryCodes, defaultCountryCode]);

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
  );

  const getLocalId = useCallback(
    (tabName: string, idx: number): string => `${formInstanceId}-${tabName}-${idx}`,
    [formInstanceId],
  );

  useEffect(() => {
    if (!open) return;
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

  const addSubListItem = useCallback<AddSubListItem>(
    (fieldKey, newItem) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        return {
          ...prev,
          [fieldKey]: [...currentList, newItem],
        };
      });
    },
    [],
  );

  const updateSubListItem = useCallback<UpdateSubListItem>(
    (fieldKey, idx, patch) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        const nextList = currentList.map((item, i) =>
          i === idx ? { ...item, ...patch } : item,
        );
        return { ...prev, [fieldKey]: nextList };
      });
    },
    [],
  );

  const removeSubListItem = useCallback<RemoveSubListItem>((fieldKey: ContactSubListKey, idx: number) => {
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
        onValidationTab(firstError.tabId);
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

  return {
    formInstanceId,
    defaultCountryCode,
    countryCodeOptions,
    saving,
    cropSrc,
    setCropSrc,
    contactDraft,
    collectionCounts,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    relationshipOptions,
    genders,
    getLocalId,
    isFieldEnabled,
    getFieldError,
    getListItemError,
    updateDraft,
    handleAvatarChange,
    handlePhoneBlur,
    addSubListItem,
    updateSubListItem,
    removeSubListItem,
    handleSave,
  };
}
