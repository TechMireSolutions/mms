import { useEffect, useMemo, useState } from "react";
import { normalizeContactForEdit, type Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useContactFormSubLists } from "@/tenant/features/contacts/hooks/useContactFormSubLists";
import { useContactFormSave } from "@/tenant/features/contacts/hooks/useContactFormSave";
import { useContactFormDraftHelpers } from "@/tenant/features/contacts/hooks/useContactFormDraftHelpers";

/** Ensure Social / Emergency tabs open with one editable row (zero-click). */
function withEmptyCollectionRows(
  draft: Partial<Contact>,
  socialPlatforms: string[],
  relationshipOptions: string[],
): Partial<Contact> {
  const socials = draft.socials ?? [];
  const emergencyContacts = draft.emergencyContacts ?? [];
  return {
    ...draft,
    socials:
      socials.length > 0
        ? socials
        : [{ platform: socialPlatforms[0] || "Facebook", url: "" }],
    emergencyContacts:
      emergencyContacts.length > 0
        ? emergencyContacts
        : [{ relationship: relationshipOptions[0] || "Father", contactId: "" }],
  };
}

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
  const formInstanceId = String(contact?.id ?? "new");
  const defaultCountryCode = defaultPhoneCountryCode;

  const countryCodeOptions = useMemo(() => {
    const list = (countryCodes || []).map((countryItem) => countryItem.code).filter(Boolean);
    return Array.from(new Set([defaultCountryCode, ...list].filter(Boolean)));
  }, [countryCodes, defaultCountryCode]);

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    withEmptyCollectionRows(
      normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
      socialPlatforms,
      relationshipOptions,
    ),
  );

  const { saving, validationErrors, setValidationErrors, handleSave } = useContactFormSave({
    contact,
    contactDraft,
    defaultCountryCode,
    onSave,
    onClose,
    onValidationTab,
  });

  const { addSubListItem, ensureSubListItem, updateSubListItem, removeSubListItem } =
    useContactFormSubLists(setContactDraft);

  const {
    cropSrc,
    setCropSrc,
    collectionCounts,
    getLocalId,
    isFieldEnabled,
    getFieldError,
    getListItemError,
    updateDraft,
    handleAvatarChange,
    handlePhoneBlur,
  } = useContactFormDraftHelpers({
    formInstanceId,
    defaultCountryCode,
    fields,
    isTabFieldEnabled,
    validationErrors,
    contactDraft,
    setContactDraft,
  });

  useEffect(() => {
    if (!open) return;
    setContactDraft(
      withEmptyCollectionRows(
        normalizeContactForEdit(contact, initialDraft, defaultCity, defaultProvince, defaultCountry),
        socialPlatforms,
        relationshipOptions,
      ),
    );
    setValidationErrors([]);
  }, [open, contact, initialDraft, defaultCity, defaultProvince, defaultCountry, setValidationErrors]);

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
    ensureSubListItem,
    updateSubListItem,
    removeSubListItem,
    handleSave,
  };
}
