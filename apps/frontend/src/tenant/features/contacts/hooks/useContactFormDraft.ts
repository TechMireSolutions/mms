import { useEffect, useState } from "react";
import type { Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import {
  buildInitialContactDraft,
  contactDraftSnapshot,
} from "@/tenant/features/contacts/hooks/contactFormDraftUtils";
import { useContactFormSubLists } from "@/tenant/features/contacts/hooks/useContactFormSubLists";
import { useContactFormSave } from "@/tenant/features/contacts/hooks/useContactFormSave";
import { useContactFormDraftHelpers } from "@/tenant/features/contacts/hooks/useContactFormDraftHelpers";
import { useContactFormDraftOptions } from "@/tenant/features/contacts/hooks/useContactFormDraftOptions";

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

  const {
    optionDefaults,
    countryCodeOptions,
    countryOptions,
    updateCountryOptions,
    updateDialCodeOptions,
  } = useContactFormDraftOptions({
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    relationshipOptions,
    defaultCountryCode,
    countryCodes,
    defaultCountry,
    updateCountryCodes,
  });

  const [contactDraft, setContactDraft] = useState<Partial<Contact>>(() =>
    buildInitialContactDraft({
      contact,
      initialDraft,
      defaultCity,
      defaultProvince,
      defaultCountry,
      optionDefaults,
      fields,
      socialPlatforms,
      relationshipOptions,
    }),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    contactDraftSnapshot(contactDraft),
  );

  const { saving, validationErrors, setValidationErrors, handleSave } = useContactFormSave({
    contact,
    contactDraft,
    defaultCountryCode,
    onSave,
    onClose,
    onValidationTab,
  });

  const isDirty = contactDraftSnapshot(contactDraft) !== baselineSnapshot;

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
    const nextDraft = buildInitialContactDraft({
      contact,
      initialDraft,
      defaultCity,
      defaultProvince,
      defaultCountry,
      optionDefaults,
      fields,
      socialPlatforms,
      relationshipOptions,
    });
    setContactDraft(nextDraft);
    setBaselineSnapshot(contactDraftSnapshot(nextDraft));
    setValidationErrors([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?.id]);

  return {
    formInstanceId,
    defaultCountryCode,
    countryCodeOptions,
    countryOptions,
    updateCountryOptions,
    updateDialCodeOptions,
    saving,
    isDirty,
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
