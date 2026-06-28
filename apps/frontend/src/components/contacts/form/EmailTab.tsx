import React from "react";
import { motion } from "framer-motion";
import { Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultFieldValue, Contact, EmailAddress } from "@mms/shared";

import { Field, FormEmptyState, RequiredBanner, CustomFieldInput, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";

type ContactEmail = EmailAddress & Record<string, unknown>;

interface EmailTabProps {
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
  required?: boolean;
  errors?: ValidationError[];
}

/**
 * EmailTab component for managing contact email addresses dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function EmailTab({
  contactDraft,
  onChange,
  required = false,
  errors = [],
}: EmailTabProps): React.JSX.Element {
  const { emailLabels, updateEmailLabels } = useContactConfig();
  const { t } = useTranslation();
  const defaultEmailLabel = emailLabels[0] || t('contacts.detail.personalLabel');
  const enabledFields = useVisibleContactFields("emails");

  const createNewEmail = (): ContactEmail => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((field) => {
      if (field.key === "label") {
        item[field.key] = defaultEmailLabel;
      } else {
        item[field.key] = getDefaultFieldValue(field);
      }
    });
    return item as ContactEmail;
  };

  const contactEmails = (contactDraft.emails || []) as ContactEmail[];

  const updateContactEmails = (emails: ContactEmail[]): void => {
    onChange({ ...contactDraft, emails });
  };

  const updateEmail = (emailIndex: number, patch: Partial<ContactEmail>): void => {
    updateContactEmails(
      contactEmails.map((email, index) => (index === emailIndex ? { ...email, ...patch } : email)),
    );
  };

  const showLabelField = enabledFields.find((field) => field.key === "label");
  const bodyFields = enabledFields.filter((field) => field.key !== "label");

  return (
    <div className="space-y-3">
      {required && contactEmails.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneEmailRequired")} />}
      {contactEmails.length === 0 && <FormEmptyState icon={Mail} text={t("contacts.form.noEmailAddressesYet")} />}

      {contactEmails.map((email, emailIndex) => (
        <motion.div
          key={emailIndex}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={COLLECTION_CARD}
        >
          <div className="flex items-center justify-between">
            {showLabelField ? (
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={emailLabels || []}
                  value={email.label || ""}
                  onChange={(value) => updateEmail(emailIndex, { label: value })}
                  onUpdateOptions={updateEmailLabels}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => updateContactEmails(contactEmails.filter((_, index) => index !== emailIndex))}
              label={t("contacts.form.removeEmailAddress", { index: emailIndex + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => {
                const fieldError = errors.find(
                  (error) => error.tabId === "emails" && error.index === emailIndex && error.fieldId === field.key
                );
                return (
                  <Field key={field.key} id={`emails-${emailIndex}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={email[field.key]}
                      onChange={(value) => updateEmail(emailIndex, { [field.key]: value })}
                      error={!!fieldError}
                    />
                  </Field>
                );
              })}
            </div>
          )}
        </motion.div>
      ))}

      <Button
        type="button"
        variant="ghost"
        onClick={() => updateContactEmails([...contactEmails, createNewEmail()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmailAddress")}</span>
      </Button>
    </div>
  );
}
