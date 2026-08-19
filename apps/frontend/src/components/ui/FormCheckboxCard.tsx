import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";

export interface FormCheckboxCardProps {
  id: string;
  name?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

/**
 * Accessible form toggle card component conforming to MMS UI standards:
 * - 44px minimum touch target height
 * - Unified primary checked tone vs muted idle tone
 * - Explicit label/id linkage and inline error rendering
 */
export function FormCheckboxCard({
  id,
  name,
  checked,
  onCheckedChange,
  label,
  description,
  error,
  disabled = false,
  className,
  labelClassName,
}: FormCheckboxCardProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-col justify-end pt-0.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl border p-3 transition-all select-none",
          disabled ? "cursor-not-allowed opacity-60 bg-muted/20 border-border/50" : "cursor-pointer",
          checked
            ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
            : "bg-muted/30 border-border/70 hover:bg-muted/50 text-muted-foreground",
          error && "border-destructive/60",
          labelClassName,
        )}
      >
        <Checkbox
          id={id}
          name={name || id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(val) => onCheckedChange(Boolean(val))}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold leading-tight">{label}</span>
          {description && (
            <span className="mt-0.5 text-3xs text-muted-foreground font-normal leading-tight">
              {description}
            </span>
          )}
        </div>
      </label>
      {error && <FieldErrorMessage message={error} />}
    </div>
  );
}
