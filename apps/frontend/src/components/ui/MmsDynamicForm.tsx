import React from "react";
import { FormModal, FormModalProps } from "./FormModal";
import { FieldDefinition } from "@mms/shared";
import { Field, CustomFieldInput, FormEmptyState } from "./FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { BookOpen } from "lucide-react";

export interface MmsDynamicFormProps<K extends string = string> extends Omit<FormModalProps<K>, "children"> {
  isBuilderMode: boolean;
  builderPanel: React.ReactNode;
  
  // Fields & dynamic data
  fields: FieldDefinition[];
  data: Record<string, any>;
  setValue: (key: string, value: any, options?: any) => void;
  errors: Array<{ fieldId: string; message: string }>;
  readOnlyFieldKeys?: string[];
  
  // Custom renders
  renderField?: (field: FieldDefinition) => React.ReactNode;
  renderBasicContent?: () => React.ReactNode;
}

/**
 * Reusable dynamic layout form template component.
 * Standardizes dynamic tabs and configuration editing sections in a unified card design.
 */
export function MmsDynamicForm<K extends string = string>({
  isBuilderMode,
  builderPanel,
  fields,
  data,
  setValue,
  errors,
  readOnlyFieldKeys = [],
  renderField,
  renderBasicContent,
  activeTab,
  ...modalProps
}: MmsDynamicFormProps<K>): React.JSX.Element {
  const { t } = useTranslation();

  const renderTabContent = () => {
    if (renderBasicContent) {
      const node = renderBasicContent();
      if (node !== null && node !== undefined) return node;
    }

    // Standardized Dynamic/Custom Tab Rendering
    const visibleFields = fields.filter((field) => field.enabled);

    return (
      <div className="space-y-5 text-left">
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleFields.map((field) => {
              if (renderField) {
                const node = renderField(field);
                if (node !== null && node !== undefined) return node;
              }
              
              const fieldError = errors.find((error) => error.fieldId === field.key);
              return (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={data[field.key]}
                      onChange={(next) => setValue(field.key, next, { shouldValidate: true, shouldDirty: true })}
                      disabled={readOnlyFieldKeys.includes(field.key)}
                      error={!!fieldError}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
          {visibleFields.length === 0 && (
            <FormEmptyState icon={BookOpen} text={t("contacts.form.noOptionalFields")} />
          )}
        </section>
      </div>
    );
  };

  return (
    <FormModal
      activeTab={activeTab}
      builderMode={isBuilderMode}
      onBuilderModeChange={modalProps.onBuilderModeChange}
      showBuilderToggle={modalProps.showBuilderToggle}
      {...modalProps}
    >
      {isBuilderMode ? builderPanel : renderTabContent()}
    </FormModal>
  );
}
