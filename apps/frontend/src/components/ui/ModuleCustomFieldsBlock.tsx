import React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import { type FieldDefinition, type AppTranslationKey } from "@mms/shared";
import { LayoutGrid } from "lucide-react";

export interface ModuleCustomFieldsBlockProps<TRecord extends object> {
  draft: Partial<TRecord>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  tabId: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<TRecord>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
  listCustomFields: (fields: Record<string, FieldDefinition[]>, tabId?: string) => FieldDefinition[];
  idPrefix: string;
  emptyKey: AppTranslationKey;
}

/** Shared custom-fields block for module forms (Teachers/Students). */
export function ModuleCustomFieldsBlock<TRecord extends object>({
  draft,
  formInstanceId,
  fields,
  tabId,
  getFieldError,
  updateDraft,
  hideWhenEmpty = true,
  className,
  listCustomFields,
  idPrefix,
  emptyKey,
}: ModuleCustomFieldsBlockProps<TRecord>): React.JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listCustomFields(fields, tabId);

  if (customFields.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <EmptyState
        compact
        icon={LayoutGrid}
        title={t(emptyKey)}
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 @md:grid-cols-2", className)}>
      {customFields.map((field) => {
        const fieldId = `${idPrefix}-${formInstanceId}-${field.key}`;
        const error = getFieldError(field.key);
        const rawValue = (draft as Record<string, unknown>)[field.key];
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
                onChange={(nextValue) => updateDraft({ [field.key]: nextValue } as Partial<TRecord>)}
                error={Boolean(error)}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}
