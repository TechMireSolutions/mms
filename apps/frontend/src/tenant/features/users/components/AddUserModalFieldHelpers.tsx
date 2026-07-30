import React from "react";
import { AlertCircle } from "lucide-react";
import { FORM_LABEL } from "@/components/ui/formStyles";

interface FieldErrorProps {
  msg?: string;
}

export function FieldError({ msg }: FieldErrorProps): JSX.Element | null {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive font-medium mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required = false }: LabelProps): JSX.Element {
  return (
    <label className={FORM_LABEL}>
      {children}{required && <span className="text-destructive ms-0.5">*</span>}
    </label>
  );
}
