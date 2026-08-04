import type React from "react";
import type { ComponentType } from "react";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";

export type StudentFieldErrorGetter = (fieldId: string) => string | undefined;

export interface StudentStatusSelectOption {
  value: string;
  label: string;
}

export function FieldError({ message }: { message?: string }): React.JSX.Element | null {
  return <FieldErrorMessage message={message} />;
}

export function ContactProfileValue({
  label,
  value,
  icon,
  iconClassName,
  error,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  error?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const Icon = icon;
  const hasValue = value.trim().length > 0;

  return (
    <Field label={label} hint={t("students.form.contactFieldHint")} error={error}>
      <div
        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
          error ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-muted/25"
        }`}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${error ? "text-destructive" : iconClassName || "text-muted-foreground"}`}
        />
        <span className={`text-sm font-semibold ${hasValue ? "text-foreground" : "text-muted-foreground"}`}>
          {hasValue ? value : t("students.form.notSetOnContact")}
        </span>
      </div>
    </Field>
  );
}
