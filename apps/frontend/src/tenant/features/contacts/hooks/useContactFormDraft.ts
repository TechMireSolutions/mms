import { useEffect, useMemo, useState } from "react";
import {
  applyContactScalarCustomFieldDefaults,
  normalizeContactForEdit,
  type Contact,
  type ContactItemNormalizeDefaults,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import {
  mergeCountryDialCodeOptions,
  mergeCountryNameOptions,
  normalizeDialCode,
} from "@/lib/contacts/countryCodeOptions";
import { useContactFormSubLists } from "@/tenant/features/contacts/hooks/useContactFormSubLists";
import { useContactFormSave } from "@/tenant/features/contacts/hooks/useContactFormSave";
import { useContactFormDraftHelpers } from "@/tenant/features/contacts/hooks/useContactFormDraftHelpers";

/** Ensure Social / Relationship tabs open with one editable row (zero-click). */
function withEmptyCollectionRows(
  draft: Partial<Contact>,
  socialPlatforms: string[],
  relationshipOptions: string[],
): Partial<Contact> {
  const socials = draft.socials ?? [];
  const relationshipContacts = draft.relationshipContacts ?? [];
  return {
    ...draft,
    socials:
      socials.length > 0
        ? socials
        : [{ platform: socialPlatforms[0] ?? "", url: "" }],
    relationshipContacts:
      relationshipContacts.length > 0
        ? relationshipContacts
        : [{ relationship: relationshipOptions[0] ?? "", contactId: "" }],
  };
}

function buildOptionDefaults({
  phoneLabels,
  emailLabels,
  addressLabels,
  socialPlatforms,
  relationshipOptions,
  defaultPhoneCountryCode,
}: {
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  socialPlatforms: string[];
  relationshipOptions: string[];
  defaultPhoneCountryCode: string;
}): ContactItemNormalizeDefaults {
  return {
    phoneLabel: phoneLabels[0],
    emailLabel: emailLabels[0],
    addressLabel: addressLabels[0],
    socialPlatform: socialPlatforms[0],
    relationship: relationshipOptions[0] ?? "",
    defaultPhoneCountryCode,
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
  onValidationTab: (tabId: string, fieldId?: string, index?: number) => void;
}) {
  const {
    isTabFieldEnabled,
    isTabFieldRequired,
    fields,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    relationships: relationshipOptions,
    genders,
    countryCodes,
    defaultPhoneCountryCode,
    updateGenders,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateSocialPlatforms,
    updateRelationships,
    updateCountryCodes,
  } = useContactConfig();
  const formInstanceId = String(contact?.id ?? "new");
  const defaultCountryCode = defaultPhoneCountryCode;

  const optionDefaults = useMemo(
    () =>
      buildOptionDefaults({
        phoneLabels,
        emailLabels,
        addressLabels,
        socialPlatforms,
        relationshipOptions,
        defaultPhoneCountryCode: defaultCountryCode,
      }),
    [
      phoneLabels,
      emailLabels,
      addressLabels,
      socialPlatforms,
      relationshipOptions,
      defaultCountryCode,
    ],
  );

  const countryCodeOptions = useMemo(() => {
    const list = (countryCodes || [])
      .map((countryItem) => normalizeDialCode(countryItem.code))
      .filter(Boolean);
    const fallback = normalizeDialCode(defaultCountryCode);
    return Array.from(new Set([fallback, ...list].filter(Boolean)));
  }, [countryCodes, defaultCountryCode]);

  const countryOptions = useMemo(() => {
    const names = (countryCodes || []).map((entry) => entry.country).filter(Boolean);
    return Array.from(new Set([defaultCountry, ...names].filter(Boolean)));
  }, [countryCodes, defaultCountry]);

  const updateCountryOptions = (nextCountries: string[]) => {
    updateCountryCodes(mergeCountryNameOptions(countryCodes, nextCountries));
  };

  const updateDialCodeOptions = (nextCodes: string[]) => {
    updateCountryCodes(mergeCountryDialCodeOptions(countryCodes, nextCodes));
  };

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    withEmptyCollectionRows(
      applyContactScalarCustomFieldDefaults(
        normalizeContactForEdit(
          contact,
          initialDraft,
          defaultCity,
          defaultProvince,
          defaultCountry,
          optionDefaults,
        ),
        fields,
      ),
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
    isFieldRequired,
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
    isTabFieldRequired,
    validationErrors,
    contactDraft,
    setContactDraft,
  });

  useEffect(() => {
    if (!open) return;
    setContactDraft(
      withEmptyCollectionRows(
        applyContactScalarCustomFieldDefaults(
          normalizeContactForEdit(
            contact,
            initialDraft,
            defaultCity,
            defaultProvince,
            defaultCountry,
            optionDefaults,
          ),
          fields,
        ),
        socialPlatforms,
        relationshipOptions,
      ),
    );
    setValidationErrors([]);
  }, [
    open,
    contact,
    initialDraft,
    defaultCity,
    defaultProvince,
    defaultCountry,
    optionDefaults,
    fields,
    socialPlatforms,
    relationshipOptions,
    setValidationErrors,
  ]);

  return {
    formInstanceId,
    defaultCountryCode,
    countryCodeOptions,
    countryOptions,
    updateCountryOptions,
    updateDialCodeOptions,
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
    updateGenders,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateSocialPlatforms,
    updateRelationships,
    getLocalId,
    isFieldEnabled,
    isFieldRequired,
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
    fields,
  };
}
