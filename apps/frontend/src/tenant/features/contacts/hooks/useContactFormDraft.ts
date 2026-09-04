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
import { useContactDuplicateCheck } from "@/tenant/features/contacts/hooks/useContactDuplicateCheck";

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
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    relationships: relationshipOptions,
    genders,
    countryCodes,
    educationDegrees,
    employmentTypes,
    skillCategories,
    skillProficiencies,
    tags,
    lookupsLoading,
    lookupsError,
    defaultPhoneCountryCode,
    updateGenders,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateSocialPlatforms,
    updateRelationships,
    updateEducationDegrees,
    updateEmploymentTypes,
    updateSkillCategories,
    updateSkillProficiencies,
    updateTags,
    updateCountryCodes,
    fields,
    isTabFieldEnabled,
    isTabFieldRequired,
  } = useContactConfig();

  const [instanceSuffix] = useState(() => Math.random().toString(36).substring(2, 8));
  const formInstanceId = `${contact?.id ?? "new"}-${instanceSuffix}`;
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
    educationDegrees,
    employmentTypes,
    skillCategories,
    skillProficiencies,
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
    onBaselineReset: (finalized) => setBaselineSnapshot(contactDraftSnapshot(finalized)),
  });

  const isDirty = contactDraftSnapshot(contactDraft) !== baselineSnapshot;

  const { addSubListItem, ensureSubListItem, updateSubListItem, removeSubListItem, setPrimarySubListItem } =
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
    validationErrors,
    contactDraft,
    setContactDraft,
    isTabFieldEnabled,
    isTabFieldRequired,
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
      socialPlatforms,
      relationshipOptions,
    });
    setContactDraft(nextDraft);
    setBaselineSnapshot(contactDraftSnapshot(nextDraft));
    setValidationErrors([]);
    // Intentional dep-array: only reset when the modal opens or the contact identity changes.
    // Including `contact` object would re-fire on every server sync and lose in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?.id]);

  const duplicateCount = useContactDuplicateCheck({
    open,
    contactId: contact?.id,
    contactDraft,
  });

  return {
    formInstanceId,
    defaultCountryCode,
    duplicateCount,
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
    educationDegrees,
    employmentTypes,
    skillCategories,
    skillProficiencies,
    tags,
    lookupsLoading,
    lookupsError,
    updateGenders,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateSocialPlatforms,
    updateRelationships,
    updateEducationDegrees,
    updateEmploymentTypes,
    updateSkillCategories,
    updateSkillProficiencies,
    updateTags,
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
    setPrimarySubListItem,
    handleSave,
    validationErrors,
    fields,
  };
}

