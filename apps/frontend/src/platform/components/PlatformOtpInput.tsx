import React, { useRef } from "react";
import { FORM_OTP_DIGIT } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

interface PlatformOtpInputProps {
  value: string[];
  onChange: (updatedValue: string[]) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Six-digit OTP input used on platform setup and password reset. */
export default function PlatformOtpInput({
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: PlatformOtpInputProps): React.JSX.Element {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string): void => {
    if (!/^\d?$/.test(digit)) return;
    const updatedValue = [...value];
    updatedValue[index] = digit;
    onChange(updatedValue);
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label={ariaLabel}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={cn(
            FORM_OTP_DIGIT,
            digit ? "border-primary/60 bg-primary/5" : "border-border",
          )}
          aria-label={`${ariaLabel} ${index + 1}`}
        />
      ))}
    </div>
  );
}

export function createEmptyOtp(): string[] {
  return Array(CODE_LENGTH).fill("");
}

export function isOtpComplete(value: string[]): boolean {
  return value.join("").length === CODE_LENGTH;
}

export const PLATFORM_OTP_LENGTH = CODE_LENGTH;
