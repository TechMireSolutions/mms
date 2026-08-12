import { Checkbox } from "@/components/ui/checkbox";
import { Field, RequiredMark } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { useTranslation } from "@/hooks/useTranslation";
import { type ModuleFieldDef } from "@mms/shared";

interface DistributeModalCustomFieldProps {
  field: ModuleFieldDef;
  fieldValue: unknown;
  updateField: (field: string, value: unknown) => void;
  getCustomFieldPlaceholder: (fieldLabel: string) => string;
}

export function DistributeModalCustomField({
  field,
  fieldValue,
  updateField,
  getCustomFieldPlaceholder,
}: DistributeModalCustomFieldProps) {
  const { t } = useTranslation();
  const fieldId = `custom-${field.id}`;

  // Boolean fields render inline with label (not inside a Field wrapper) for checkbox UX.
  if (field.type === "boolean") {
    return (
      <label htmlFor={fieldId} className="flex cursor-pointer select-none items-center gap-2.5 py-2">
        <Checkbox
          id={fieldId}
          name={field.id}
          checked={!!fieldValue}
          onCheckedChange={(checked) => updateField(field.id, !!checked)}
        />
        <span className="text-xs font-medium text-foreground">
          {field.label}{field.required ? <RequiredMark /> : null}
        </span>
      </label>
    );
  }

  // Adapt ModuleFieldDef → shape CustomFieldInput accepts (key instead of id).
  const adaptedField = {
    key: field.id,
    label: field.label,
    type: (field.type || "text") as any,
    required: field.required,
    options: field.options,
    placeholder: field.placeholder || getCustomFieldPlaceholder(field.label),
    defaultValue: field.defaultValue,
  };

  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <Field id={fieldId} label={field.label} required={field.required}>
        <CustomFieldInput
          field={adaptedField as any}
          value={fieldValue}
          onChange={(value) => updateField(field.id, value)}
        />
      </Field>
    </div>
  );
}