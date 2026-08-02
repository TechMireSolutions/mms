import React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import {
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
} from "@mms/shared";

export function ContactCustomFieldsTab({
  contactDraft,
  formInstanceId,
  fields,
  tabId = "custom",
  getFieldError,
  updateDraft,
  hideWhenEmpty = false,
  className,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  /** Config tab whose non-seed fields to render (default: system Custom tab). */
  tabId?: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  /** When true, render nothing if this tab has no custom fields (e.g. embed under Basic). */
  hideWhenEmpty?: boolean;
  className?: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listEnabledCustomContactFormFields(fields, tabId);

  if (customFields.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("contacts.form.customFieldsEmpty")}
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 @md:grid-cols-2", className)}>
      {customFields.map((field) => {
        const fieldId = `cf-${formInstanceId}-${field.key}`;
        const error = getFieldError(field.key);
        const rawValue = (contactDraft as Record<string, unknown>)[field.key];
        const inputField: FieldDefinition = { ...field, key: fieldId };
        return (
          <div
            key={field.key}
            className={field.type === "textarea" || field.type === "tags" ? "@md:col-span-2" : undefined}
          >
            <Field
              label={resolveRegistryLabel(field, t)}
              required={field.required}
              error={error}
              id={fieldId}
            >
              <CustomFieldInput
                field={inputField}
                value={rawValue}
                onChange={(nextValue) => updateDraft({ [field.key]: nextValue } as Partial<Contact>)}
                error={Boolean(error)}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}
