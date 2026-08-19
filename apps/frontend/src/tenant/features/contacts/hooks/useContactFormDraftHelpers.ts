import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import {
  IMAGE_UPLOAD_MAX_INPUT_BYTES,
  REMOVED_FORM_FIELD_KEYS,
  isContactCustomCollectionTab,
  type Contact,
  type ValidationError,
} from "@mms/shared";

export function useContactFormDraftHelpers({
  formInstanceId,
  defaultCountryCode,
  isTabFieldEnabled,
  isTabFieldRequired,
  validationErrors,
  contactDraft,
  setContactDraft,
}: {
  formInstanceId: string;
  defaultCountryCode: string;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;
  validationErrors: ValidationError[];
  contactDraft: Partial<Contact>;
  setContactDraft: Dispatch<SetStateAction<Partial<Contact>>>;
}) {
  const { t } = useTranslation();
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const getLocalId = useCallback(
    (tabName: string, idx: number): string => `${formInstanceId}-${tabName}-${idx}`,
    [formInstanceId],
  );

  const collectionCounts = useMemo(() => {
    const filledPhones = (contactDraft.phones || []).filter((phone) => (phone.number || "").trim()).length;
    const filledEmails = (contactDraft.emails || []).filter((email) => (email.address || "").trim()).length;
    const filledAddresses = (contactDraft.addresses || []).filter(
      (address) => (address.line1 || "").trim(),
    ).length;
    const filledSocials = (contactDraft.socials || []).filter((social) => (social.url || "").trim()).length;
    const filledEducation = (contactDraft.education || []).filter(
      (edu) => (edu.institution || edu.fieldOfStudy || "").trim(),
    ).length;
    const filledExperience = (contactDraft.experience || []).filter(
      (exp) => (exp.title || exp.organization || "").trim(),
    ).length;
    const filledSkills = (contactDraft.skills || []).filter(
      (skill) => (skill.name || "").trim(),
    ).length;
    const filledRelationships = (contactDraft.relationshipContacts || []).filter(
      (link) => link.contactId,
    ).length;
    const customCounts: Record<string, number> = {};
    for (const [key, value] of Object.entries(contactDraft)) {
      if (isContactCustomCollectionTab(key) && Array.isArray(value)) {
        customCounts[key] = value.length;
      }
    }
    return {
      filledPhones,
      filledEmails,
      filledAddresses,
      filledSocials,
      filledEducation,
      filledExperience,
      filledSkills,
      filledRelationships,
      ...customCounts,
    };
  }, [contactDraft]);

  const isFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      if ((REMOVED_FORM_FIELD_KEYS as readonly string[]).includes(fieldId)) return false;
      return isTabFieldEnabled(tabId, fieldId);
    },
    [isTabFieldEnabled],
  );

  const isFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      if (!isFieldEnabled(tabId, fieldId)) return false;
      return isTabFieldRequired(tabId, fieldId);
    },
    [isFieldEnabled, isTabFieldRequired],
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
  }, [setContactDraft]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.error(t("account.photoUploadFailed"));
      event.target.value = "";
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_INPUT_BYTES) {
      notify.error(t("contacts.form.avatarTooLarge"));
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      if (typeof readerEvent.target?.result === "string") {
        setCropSrc(readerEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handlePhoneBlur = (index: number) => {
    setContactDraft((prev) => {
      const currentPhones = prev.phones || [];
      const phone = currentPhones[index];
      if (!phone || !phone.number) return prev;
      const previousNumber = phone.number.trim();
      const { countryCode, formattedNumber: number } = formatContactPhoneDisplay(
        phone.number,
        phone.countryCode || defaultCountryCode,
      );
      const updatedPhones = [...currentPhones];
      if (previousNumber !== number.trim()) {
        const { whatsappStatus: _cleared, ...rest } = phone;
        void _cleared;
        updatedPhones[index] = { ...rest, countryCode, number };
      } else {
        updatedPhones[index] = { ...phone, countryCode, number };
      }
      return { ...prev, phones: updatedPhones };
    });
  };

  return {
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
  };
}
