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
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
  required?: boolean;
  errors?: ValidationError[];
}

/**
 * EmailTab component for managing contact email addresses dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function EmailTab({
  data,
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
    enabledFields.forEach((f) => {
      if (f.key === "label") {
        item[f.key] = defaultEmailLabel;
      } else {
        item[f.key] = getDefaultFieldValue(f);
      }
    });
    return item as ContactEmail;
  };

  const emails = (data.emails || []) as ContactEmail[];

  const upd = (list: ContactEmail[]): void => {
    onChange({ ...data, emails: list });
  };

  const updateEmail = (i: number, patch: Partial<ContactEmail>): void => {
    upd(emails.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  const showLabelField = enabledFields.find((f) => f.key === "label");
  const bodyFields = enabledFields.filter((f) => f.key !== "label");

  return (
    <div className="space-y-3">
      {required && emails.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneEmailRequired")} />}
      {emails.length === 0 && <FormEmptyState icon={Mail} text={t("contacts.form.noEmailAddressesYet")} />}

      {emails.map((e, i) => (
        <motion.div
          key={i}
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
                  value={e.label || ""}
                  onChange={(val) => updateEmail(i, { label: val })}
                  onUpdateOptions={updateEmailLabels}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => upd(emails.filter((_, j) => j !== i))}
              label={t("contacts.form.removeEmailAddress", { index: i + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => {
                const fieldError = errors.find(
                  (err) => err.tabId === "emails" && err.index === i && err.fieldId === field.key
                );
                return (
                  <Field key={field.key} id={`emails-${i}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={e[field.key]}
                      onChange={(val) => updateEmail(i, { [field.key]: val })}
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
        onClick={() => upd([...emails, createNewEmail()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmailAddress")}</span>
      </Button>
    </div>
  );
}

