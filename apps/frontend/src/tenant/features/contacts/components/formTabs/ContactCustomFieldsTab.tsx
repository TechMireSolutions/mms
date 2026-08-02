import React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import {
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
} from "@mms/shared";

export function ContactCustomFieldsTab({
  contactDraft,
  formInstanceId,
  fields,
  getFieldError,
  updateDraft,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const customFields = listEnabledCustomContactFormFields(fields);

  if (customFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("contacts.form.customFieldsEmpty")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
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
