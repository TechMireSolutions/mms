import type React from "react";

import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const requiredMark = required ? " *" : "";
  if (field.type === "textarea") {
    return (
      <div key={field.id} className="sm:col-span-2">
        <label htmlFor={inputId} className={FORM_LABEL}>{label}{requiredMark}</label>
        <Textarea id={inputId} name={field.id} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    );
  }

  return (
    <div key={field.id}>
      <label htmlFor={inputId} className={FORM_LABEL}>{label}{requiredMark}</label>
      <Input
        id={inputId}
        type={field.type === "date" ? "date" : "text"}
        className={FORM_INPUT}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
