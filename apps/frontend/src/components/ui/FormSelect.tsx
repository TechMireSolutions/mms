import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  "aria-label"?: string;
}

const SELECT_CLASS =
  "w-full min-h-[44px] cursor-pointer appearance-none rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-foreground shadow-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

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
  "aria-label": ariaLabel,
}: FormSelectProps): React.JSX.Element {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => {
          const option = typeof opt === "string" ? { value: opt, label: opt } : opt;
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
