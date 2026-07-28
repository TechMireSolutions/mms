import React from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FORM_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

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
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={id} className={FORM_LABEL}>
        {label}
      </label>
      <div className="relative">
        <Mail
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80"
          aria-hidden
        />
        <Input
          id={id}
          type="email"
          name="email"
          autoComplete={autoComplete}
          inputMode="email"
          autoFocus={autoFocus}
          spellCheck={false}
          required={required}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 ps-9",
            error && "border-destructive focus-visible:ring-destructive/25",
          )}
        />
      </div>
      {error ? (
        <p id={errorId} className={FORM_ERROR} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
