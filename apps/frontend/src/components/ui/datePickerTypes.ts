import type * as React from "react";

export interface DatePickerProps {
  value?: string | number | Date | null;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string | number | null;
  max?: string | number | null;
  id?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  mode?: "date" | "year" | "flexible";
  yearOnly?: boolean;
  minYear?: number | null;
  maxYear?: number | null;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  ref?: React.Ref<HTMLInputElement>;
}
