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
import { apiJson } from "@/lib/apiClient";

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
    enabledTabIds,
    fieldConfig,
    fields,
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
    onBaselineReset: (finalized) => setBaselineSnapshot(contactDraftSnapshot(finalized)),
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
    isTabFieldEnabled,
    isTabFieldRequired,
    validationErrors,
    contactDraft,
    setContactDraft,
  });

  const [duplicateCount, setDuplicateCount] = useState(0);

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
    setDuplicateCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?.id]);

  useEffect(() => {
    if (!open || contact?.id) {
      setDuplicateCount(0);
      return;
    }
    const hasCandidateKey = Boolean(
      contactDraft.name?.trim() ||
      contactDraft.firstName?.trim() ||
      contactDraft.phone?.trim() ||
      (contactDraft.phones && contactDraft.phones.some((p) => p.number?.trim())) ||
      contactDraft.email?.trim() ||
      (contactDraft.emails && contactDraft.emails.some((e) => e.address?.trim())) ||
      contactDraft.cnic?.trim()
    );
    if (!hasCandidateKey) {
      setDuplicateCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiJson<{ matchCount: number }>('/api/contacts/duplicate-check', {
          method: 'POST',
          body: JSON.stringify({ contact: contactDraft }),
        });
        setDuplicateCount(res.matchCount ?? 0);
      } catch {
        // Non-blocking duplicate check: ignore gracefully
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    open,
    contact?.id,
    contactDraft.name,
    contactDraft.firstName,
    contactDraft.phone,
    contactDraft.email,
    contactDraft.cnic,
    contactDraft.phones,
    contactDraft.emails,
  ]);

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
    handleSave,
    validationErrors,
    enabledTabIds,
    fieldConfig,
    fields,
  };
}

