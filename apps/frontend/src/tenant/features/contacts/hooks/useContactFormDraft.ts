import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { Contact, normalizeContactForEdit } from "@mms/shared";
import { useContactFormSubLists } from "@/tenant/features/contacts/hooks/useContactFormSubLists";
import { useContactFormSave } from "@/tenant/features/contacts/hooks/useContactFormSave";

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
  const formInstanceId = contact?.id || "new";
  const defaultCountryCode = defaultPhoneCountryCode;

  const countryCodeOptions = useMemo(() => {
    const list = (countryCodes || []).map((countryItem) => countryItem.code).filter(Boolean);
    return Array.from(new Set([defaultCountryCode, ...list].filter(Boolean)));
  }, [countryCodes, defaultCountryCode]);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
  );

  const { saving, validationErrors, setValidationErrors, handleSave } = useContactFormSave({
    contact,
    contactDraft,
    defaultCountryCode,
    onSave,
    onClose,
    onValidationTab,
  });

  const { addSubListItem, updateSubListItem, removeSubListItem } =
    useContactFormSubLists(setContactDraft);

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
  }, [open, contact, initialDraft, defaultCity, defaultProvince, defaultCountry, setValidationErrors]);

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
