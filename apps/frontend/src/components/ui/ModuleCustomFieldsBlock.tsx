import React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import { type FieldDefinition, type CustomFieldConfig, type AppTranslationKey } from "@mms/shared";
import { LayoutGrid } from "lucide-react";

export interface ModuleCustomFieldsBlockProps<TRecord extends object> {
  draft: Partial<TRecord>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  customFields?: (FieldDefinition | CustomFieldConfig)[];
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
  customFields,
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

  const activeCustomFields = React.useMemo(() => {
    const legacyActive = listCustomFields(fields, tabId);
    if (!customFields) return legacyActive;
    const dfsActive = customFields.filter((f) => (f as CustomFieldConfig).enabled !== false);
    const combined = [...dfsActive];
    for (const leg of legacyActive) {
      if (!combined.some((f) => f.key === leg.key)) {
        combined.push(leg);
      }
    }
    return combined;
  }, [customFields, fields, tabId, listCustomFields]);

  if (activeCustomFields.length === 0) {
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
      {activeCustomFields.map((field) => {
        const fieldId = `${idPrefix}-${formInstanceId}-${field.key}`;
        const error = getFieldError(field.key);
        const draftObj = draft as Record<string, unknown>;
        const customDataObj = draftObj.customData as Record<string, unknown> | undefined;
        const rawValue = draftObj[field.key] ?? customDataObj?.[field.key];
        const inputField: FieldDefinition | CustomFieldConfig = { ...field, key: fieldId };
        const isDfsField = Boolean(customFields && customFields.some((f) => f.key === field.key));

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
                onChange={(nextValue) => {
                  if (isDfsField) {
                    const currentCustomData = (draftObj.customData as Record<string, unknown> | undefined) ?? {};
                    updateDraft({
                      customData: {
                        ...currentCustomData,
                        [field.key]: nextValue,
                      },
                    } as unknown as Partial<TRecord>);
                  } else {
                    updateDraft({ [field.key]: nextValue } as Partial<TRecord>);
                  }
                }}
                error={Boolean(error)}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}

