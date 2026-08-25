import type React from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/FormPrimitives";

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
  return (
    <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <Field id={inputId} label={`${label}${required ? " *" : ""}`} required={required}>
        {field.type === "textarea" ? (
          <Textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        ) : field.type === "select" ? (
          <Select
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        )}
      </Field>
    </div>
  );
}