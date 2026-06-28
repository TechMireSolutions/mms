import React from "react";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact } from "@mms/shared";

interface BasicTabProps {
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
  tabId?: string;
  readOnlyFieldKeys?: string[];
  errors?: ValidationError[];
}

/**
 * BasicTab component for editing basic contact information dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function BasicTab({
  contactDraft,
  onChange,
  tabId = "basic",
  readOnlyFieldKeys = [],
  errors = [],
}: BasicTabProps): React.JSX.Element {
  const { isTabFieldRequired } = useContactConfig();
  const { t } = useTranslation();
  const visibleFields = useVisibleContactFields(tabId);

  const updateContactField = (fieldKey: string, fieldValue: unknown): void => {
    const updatedContactDraft = { ...contactDraft, [fieldKey]: fieldValue };
    if (fieldKey === "firstName" || fieldKey === "lastName") {
      const firstName = fieldKey === "firstName" ? String(fieldValue) : (contactDraft.firstName || "");
      const lastName = fieldKey === "lastName" ? String(fieldValue) : (contactDraft.lastName || "");
      updatedContactDraft.name = [firstName, lastName].filter(Boolean).join(" ");
    }
    onChange(updatedContactDraft);
  };

  const enabledFields = visibleFields;

  return (
    <div className="space-y-5">
      {enabledFields.map((field) => {
        const label = field.label as string;
        const required = isTabFieldRequired(tabId, field.key);
        const fieldError = errors.find((error) => error.fieldId === field.key && error.tabId === tabId);
        return (
          <Field key={field.key} id={field.key} label={label} required={required} hint={field.description} error={fieldError?.message}>
            <CustomFieldInput
              field={field}
              value={contactDraft[field.key]}
              onChange={(value) => updateContactField(field.key, value)}
              disabled={readOnlyFieldKeys.includes(field.key)}
              error={!!fieldError}
            />
          </Field>
        );
      })}

      {enabledFields.length === 0 && (
        <p
          className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl bg-card"
        >
          {t("contacts.form.noOptionalFields")}
        </p>
      )}
    </div>
  );
}
