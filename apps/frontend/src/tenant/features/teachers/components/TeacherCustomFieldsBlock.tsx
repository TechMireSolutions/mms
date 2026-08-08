import React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import {
  listEnabledCustomTeacherFormFields,
  type FieldDefinition,
  type Teacher,
} from "@mms/shared";
import { LayoutGrid } from "lucide-react";

interface TeacherCustomFieldsBlockProps {
  teacherDraft: Partial<Teacher>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  tabId: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Teacher>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
}

export function TeacherCustomFieldsBlock({
  teacherDraft,
  formInstanceId,
  fields,
  tabId,
  getFieldError,
  updateDraft,
  hideWhenEmpty = true,
  className,
}: TeacherCustomFieldsBlockProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listEnabledCustomTeacherFormFields(fields, tabId);

  if (customFields.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <EmptyState
        compact
        icon={LayoutGrid}
        title={t("teachers.form.customFieldsEmpty")}
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 @md:grid-cols-2", className)}>
      {customFields.map((field) => {
        const fieldId = `tf-${formInstanceId}-${field.key}`;
        const error = getFieldError(field.key);
        const rawValue = (teacherDraft as Record<string, unknown>)[field.key];
        const inputField: FieldDefinition = { ...field, key: fieldId };
        return (
          <div
            key={field.key}
            className={field.type === "textarea" || field.type === "tags" || field.type === "datetime" ? "@md:col-span-2" : undefined}
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
                onChange={(nextValue) => updateDraft({ [field.key]: nextValue } as Partial<Teacher>)}
                error={Boolean(error)}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}
