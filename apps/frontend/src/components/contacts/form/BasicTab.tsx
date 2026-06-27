import React from "react";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact } from "@mms/shared";

interface BasicTabProps {
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
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
  data,
  onChange,
  tabId = "basic",
  readOnlyFieldKeys = [],
  errors = [],
}: BasicTabProps): React.JSX.Element {
  const { isTabFieldRequired } = useContactConfig();
  const { t } = useTranslation();
  const visibleFields = useVisibleContactFields(tabId);

  const upd = (f: string, v: unknown): void => {
    const updated = { ...data, [f]: v };
    if (f === "firstName" || f === "lastName") {
      const first = f === "firstName" ? String(v) : (data.firstName || "");
      const last = f === "lastName" ? String(v) : (data.lastName || "");
      updated.name = [first, last].filter(Boolean).join(" ");
    }
    onChange(updated);
  };

  const enabledFields = visibleFields;

  return (
    <div className="space-y-5">
      {enabledFields.map((field) => {
        const label = field.label as string;
        const required = isTabFieldRequired(tabId, field.key);
        const fieldError = errors.find((e) => e.fieldId === field.key && e.tabId === tabId);
        return (
          <Field key={field.key} id={field.key} label={label} required={required} hint={field.description} error={fieldError?.message}>
            <CustomFieldInput
              field={field}
              value={data[field.key]}
              onChange={(val) => upd(field.key, val)}
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
