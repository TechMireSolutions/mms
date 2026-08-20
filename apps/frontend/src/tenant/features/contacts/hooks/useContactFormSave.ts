import { useCallback, useState } from "react";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactValidation } from "@/lib/contacts/useContactValidation";
import { getApiValidationErrors, getApiValidationMessage } from "@/lib/apiValidationMessage";
import {
  applyTitleCaseToContact,
  composeContactName,
  type Contact,
  todayISO,
  cleanContactDraft,
  syncContactScalarFields,
  normalizeToE164,
  parsePhoneNumber,
  isContactDeleted,
  findContactUniqueFieldConflicts,
  type ValidationError,
  formatSocialPlatformUrl,
  isChronologicalDateRangeValid,
} from "@mms/shared";

export function useContactFormSave({
  contact,
  contactDraft,
  defaultCountryCode,
  onSave,
  onClose,
  onValidationTab,
  onBaselineReset,
}: {
  contact?: Contact;
  contactDraft: Partial<Contact>;
  defaultCountryCode: string;
  onSave: (contact: Contact) => void | Promise<void>;
  onClose: () => void;
  onValidationTab: (tabId: string, fieldId?: string, index?: number) => void;
  onBaselineReset?: (contact: Contact) => void;
}) {
  const { t } = useTranslation();
  const { fields } = useContactConfig();
  const { language } = useGlobalSettings();
  const validate = useContactValidation();
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleSave = useCallback(
    async (options?: { keepOpen?: boolean }): Promise<boolean> => {
      setValidationErrors([]);

      if (contact && isContactDeleted(contact)) {
        notify.error(t("contacts.form.cannotEditDeleted"));
        return false;
      }

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

      if (
        typeof cleanedDraft.avatar === "string" &&
        cleanedDraft.avatar.startsWith("data:")
      ) {
        formErrors.push({
          fieldId: "avatar",
          tabId: "basic",
          message: t("contacts.form.avatarMustUpload"),
        });
      }

      if (Array.isArray(cleanedDraft.experience)) {
        cleanedDraft.experience.forEach((exp, idx) => {
          if (!exp.isCurrent && exp.startDate && exp.endDate) {
            if (!isChronologicalDateRangeValid(exp.startDate, exp.endDate)) {
              formErrors.push({
                fieldId: "endDate",
                tabId: "experience",
                index: idx,
                message: t("contacts.form.startDateBeforeEndDate"),
              });
            }
          }
        });
      }

      // Check unique fields (phone number, email address, CNIC, etc.) within the candidate draft
      if (fields) {
        const uniqueErrors = findContactUniqueFieldConflicts(
          cleanedDraft,
          [],
          fields,
          language,
        );
        if (uniqueErrors.length > 0) {
          formErrors.push(...uniqueErrors);
        }
      }

      if (formErrors.length > 0) {
        setValidationErrors(formErrors);
        const firstError = formErrors[0];
        if (firstError?.tabId) {
          onValidationTab(firstError.tabId, firstError.fieldId, firstError.index);
        }
        notify.error(t("contacts.form.pleaseFixErrors"));
        return false;
      }

      setSaving(true);
      try {
        const firstName = cleanedDraft.firstName || "";
        const lastName = cleanedDraft.lastName || "";

        const normalizedPhones = (cleanedDraft.phones || []).map((phone) => {
          const digits = (phone.number || "").replace(/\D/g, "");
          const e164 = normalizeToE164(phone.countryCode || defaultCountryCode, digits);
          const parsed = parsePhoneNumber(e164, phone.countryCode || defaultCountryCode);
          const prevDigits = (phone.number || "").replace(/\D/g, "");
          const nextDigits = (parsed.number || "").replace(/\D/g, "");
          const whatsappStatus = phone.whatsappStatus;

          return {
            ...phone,
            countryCode: parsed.countryCode,
            number: parsed.number,
            ...(prevDigits === nextDigits && whatsappStatus
              ? { whatsappStatus }
              : {}),
          };
        });

        const normalizedSocials = (cleanedDraft.socials || []).map((social) => ({
          ...social,
          url: formatSocialPlatformUrl(social.platform, social.url),
        }));

        const contactRaw: Contact = {
          ...cleanedDraft,
          id: cleanedDraft.id || contact?.id || crypto.randomUUID(),
          firstName,
          lastName,
          name: composeContactName(firstName, lastName),
          phones: normalizedPhones,
          socials: normalizedSocials,
          updatedAt: todayISO(),
          createdAt: cleanedDraft.createdAt || todayISO(),
        } as Contact;

        const titleCased = applyTitleCaseToContact(contactRaw) as Contact;
        const finalized = syncContactScalarFields(titleCased);

        await onSave(finalized);
        onBaselineReset?.(finalized);

        if (!options?.keepOpen) {
          notify.success(
            contact ? t("contacts.form.contactUpdated") : t("contacts.form.contactCreated"),
          );
          onClose();
        }
        return true;
      } catch (err: unknown) {
        const apiErrors = getApiValidationErrors(err);
        if (apiErrors) {
          setValidationErrors(apiErrors);
          const firstError = apiErrors[0];
          if (firstError?.tabId) {
            onValidationTab(firstError.tabId, firstError.fieldId, firstError.index);
          }
          notify.error(t("contacts.form.pleaseFixErrors"), {
            description: firstError?.message ?? getApiValidationMessage(err),
          });
          return false;
        }
        notify.error(t("settings.serverSaveFailed"), {
          description: err instanceof Error ? err.message : String(err),
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      contact,
      contactDraft,
      defaultCountryCode,
      fields,
      language,
      onBaselineReset,
      onClose,
      onSave,
      onValidationTab,
      t,
      validate,
    ],
  );

  return { saving, validationErrors, setValidationErrors, handleSave };
}
