import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import type { Contact, FieldDefinition, ValidationError } from "@mms/shared";

export function useContactFormDraftHelpers({
  formInstanceId,
  defaultCountryCode,
  fields,
  isTabFieldEnabled,
  validationErrors,
  contactDraft,
  setContactDraft,
}: {
  formInstanceId: string;
  defaultCountryCode: string;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  validationErrors: ValidationError[];
  contactDraft: Partial<Contact>;
  setContactDraft: Dispatch<SetStateAction<Partial<Contact>>>;
}) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const getLocalId = useCallback(
    (tabName: string, idx: number): string => `${formInstanceId}-${tabName}-${idx}`,
    [formInstanceId],
  );

  const collectionCounts = useMemo(() => {
    const filledPhones = (contactDraft.phones || []).filter((phone) => (phone.number || "").trim()).length;
    const filledEmails = (contactDraft.emails || []).filter((email) => (email.address || "").trim()).length;
    const filledAddresses = (contactDraft.addresses || []).filter(
      (address) => (address.line1 || address.city || "").trim(),
    ).length;
    const filledSocials = (contactDraft.socials || []).filter((social) => (social.url || "").trim()).length;
    const filledEmergency = (contactDraft.emergencyContacts || []).filter(
      (emergency) => emergency.contactId,
    ).length;
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
      const exists = tabFields.some((field) => field.key === fieldId);
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
  }, [setContactDraft]);

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
  };
}
