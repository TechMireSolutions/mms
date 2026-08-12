import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORM_SELECT } from "@/components/ui/formStyles";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly (FormSelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

/**
 * Native select with a visible chevron — clearly reads as a dropdown before interaction.
 */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
  id,
  name,
  "aria-label": ariaLabel,
}: FormSelectProps): React.JSX.Element {
  const fallbackId = React.useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  return (
    <div className={cn("relative", className)}>
      <select
        id={resolvedId}
        name={resolvedName}
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FORM_SELECT, "appearance-none pe-10 disabled:cursor-not-allowed disabled:opacity-50")}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {(Array.isArray(options) ? options : []).map((selectOption) => {
          const option = typeof selectOption === "string" ? { value: selectOption, label: selectOption } : selectOption;
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
