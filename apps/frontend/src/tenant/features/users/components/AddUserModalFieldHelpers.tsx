import React from "react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FieldErrorMessage } from "@/components/ui/FormField";

interface FieldErrorProps {
  msg?: string;
}

/** @deprecated Prefer `FieldErrorMessage` from FormPrimitives / FormField. */
export function FieldError({ msg }: FieldErrorProps): JSX.Element | null {
  return <FieldErrorMessage message={msg} />;
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
