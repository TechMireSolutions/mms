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
import { apiContract } from "@/lib/api";

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
    validationErrors,
    contactDraft,
    setContactDraft,
    isTabFieldEnabled,
    isTabFieldRequired,
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
      (contactDraft.phones && contactDraft.phones.some((p) => p.number?.trim())) ||
      (contactDraft.emails && contactDraft.emails.some((e) => e.address?.trim())) ||
      contactDraft.cnic?.trim()
    );
    if (!hasCandidateKey) {
      setDuplicateCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // The tag property is a computed frontend-only UI state added by normalization
        const { tag: _tag, ...cleanDraft } = contactDraft as Record<string, unknown>;
        const res = await apiContract.contacts.duplicateCheck({
          body: { contact: cleanDraft },
        });
        if (res.status === 200) {
          const body = res.body as { matchCount?: number } | undefined;
          setDuplicateCount(body?.matchCount ?? 0);
        }
      } catch {
        // Non-blocking duplicate check: ignore gracefully
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [open, contact?.id, contactDraft]);

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
    fields,
  };
}

