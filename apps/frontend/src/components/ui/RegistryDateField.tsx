import type React from "react";
import { DatePicker } from "@/components/ui/DatePicker";

export interface RegistryDateFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}

/** Thin DatePicker wrapper for module registry / custom fields (ModuleFieldDef). */
export function RegistryDateField({
  id,
  name,
  value,
  onChange,
  required,
  disabled,
  className,
  min,
  max,
  placeholder,
}: RegistryDateFieldProps): React.JSX.Element {
  return (
    <DatePicker
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className}
      min={min}
      max={max}
      placeholder={placeholder}
    />
  );
}
