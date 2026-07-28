import React from "react";
import { Mail } from "lucide-react";
import { AuthTextField } from "@/components/entry/AuthTextField";

/** Email field — thin SSOT wrapper over AuthTextField. */
export function AuthEmailField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  autoFocus,
  autoComplete = "email",
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}): React.JSX.Element {
  return (
    <AuthTextField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required={required}
      type="email"
      name="email"
      inputMode="email"
      spellCheck={false}
      icon={Mail}
    />
  );
}
