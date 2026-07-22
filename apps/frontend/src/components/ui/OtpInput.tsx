import React, { useRef } from "react";
import { FORM_OTP_DIGIT } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string[];
  onChange: (updatedValue: string[]) => void;
  ariaLabel: string;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
  idPrefix?: string;
}

/**
 * Shared OTP Input component used for 2FA, platform registration, and password reset.
 * Implements DRY standard for code verification digit entries.
 */
export function OtpInput({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  hasError = false,
  length = 6,
  idPrefix = "otp",
}: OtpInputProps): React.JSX.Element {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string): void => {
    if (!/^\d?$/.test(digit)) return;
    const updatedValue = [...value];
    updatedValue[index] = digit;
    onChange(updatedValue);
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const updatedCode = [...value];
    for (let i = 0; i < length; i++) {
      if (i < pasted.length) {
        updatedCode[i] = pasted[i];
      }
    }
    onChange(updatedCode);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || "";
        return (
          <input
            key={index}
            id={`${idPrefix}-${index}`}
            name={`${idPrefix}-${index}`}
            autoComplete="one-time-code"
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              FORM_OTP_DIGIT,
              digit ? "border-primary/60 bg-primary/5" : "border-border",
              hasError && "border-destructive/60 bg-destructive/5"
            )}
            aria-label={`${ariaLabel} ${index + 1}`}
            autoFocus={index === 0}
          />
        );
      })}
    </div>
  );
}

export function createEmptyOtp(length = 6): string[] {
  return Array(length).fill("");
}

export function isOtpComplete(value: string[], length = 6): boolean {
  return value.join("").length === length;
}
