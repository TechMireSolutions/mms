import type React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import type { ModuleFieldDef } from "@mms/shared";

interface QuestionSourceInputProps {
  field: ModuleFieldDef;
  value: string;
  onChange: (value: string) => void;
  label: string;
  inputId: string;
  required?: boolean;
}

export function QuestionSourceInput({
  field,
  value,
  onChange,
  label,
  inputId,
  required,
}: QuestionSourceInputProps): React.ReactNode {
  const adaptedField = {
    key: field.id,
    label,
    type: (field.type || "text") as any,
    required,
    options: field.options,
    placeholder: field.placeholder,
    defaultValue: field.defaultValue,
  };

  return (
    <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <Field id={inputId} label={`${label}${required ? " *" : ""}`} required={required}>
        <CustomFieldInput
          field={adaptedField as any}
          value={value}
          onChange={(val) => onChange(String(val ?? ""))}
        />
      </Field>
    </div>
  );
}