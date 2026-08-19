import { useCallback, useState } from "react";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { formatContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { useContactValidation } from "@/lib/contacts/useContactValidation";
import { getApiValidationErrors, getApiValidationMessage } from "@/lib/apiValidationMessage";
import {
  toTitleCase,
  applyTitleCaseToContact,
  composeContactName,
  type Contact,
  todayISO,
  cleanContactDraft,
  syncContactScalarFields,
  normalizeToE164,
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
}: {
  contact?: Contact;
  contactDraft: Partial<Contact>;
  defaultCountryCode: string;
  onSave: (contact: Contact) => void | Promise<void>;
  onClose: () => void;
  onValidationTab: (tabId: string, fieldId?: string, index?: number) => void;
}) {
  const { t } = useTranslation();
  const { fields } = useContactConfig();
  const { language } = useGlobalSettings();
  const validate = useContactValidation();
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleSave = useCallback(async (): Promise<void> => {
    setValidationErrors([]);

    if (contact && isContactDeleted(contact)) {
      notify.error(t("contacts.form.cannotEditDeleted"));
      return;
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
        {
          defaultPhoneCountryCode: defaultCountryCode,
          excludeContactIds: contact?.id ? [contact.id] : [],
        },
      );
      for (const err of uniqueErrors) {
        if (
          !formErrors.some(
            (e) => e.tabId === err.tabId && e.fieldId === err.fieldId && e.index === err.index,
          )
        ) {
          formErrors.push(err);
        }
      }
    }

    if (formErrors.length > 0) {
      setValidationErrors(formErrors);
      const firstError = formErrors[0];
      if (firstError.tabId) {
        onValidationTab(firstError.tabId, firstError.fieldId, firstError.index);
      }
      notify.error(t("contacts.form.pleaseFixErrors"), {
        description: firstError.message,
      });
      return;
    }

    setSaving(true);
    try {
      const firstName = toTitleCase((cleanedDraft.firstName || "").trim());
      const lastName = toTitleCase((cleanedDraft.lastName || "").trim());

      const normalizedPhones = (cleanedDraft.phones || []).map((phone) => {
        const { countryCode, formattedNumber: national } = formatContactPhoneDisplay(
          phone.number,
          phone.countryCode || defaultCountryCode,
        );
        const number = national
          ? normalizeToE164(countryCode || defaultCountryCode, national)
          : "";
        const prevDigits = (phone.number || "").replace(/\D/g, "");
        const nextDigits = number.replace(/\D/g, "");
        const { whatsappStatus, ...rest } = phone;
        return {
          ...rest,
          countryCode,
          number,
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
      notify.success(
        contact ? t("contacts.form.contactUpdated") : t("contacts.form.contactCreated"),
      );
      onClose();
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
        return;
      }
      notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }, [
    contact,
    contactDraft,
    defaultCountryCode,
    onClose,
    onSave,
    onValidationTab,
    t,
    validate,
  ]);

  return { saving, validationErrors, setValidationErrors, handleSave };
}

