import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormFooterBadgeTone = "primary" | "warning" | "destructive" | "info" | "success" | "muted";

const FORM_FOOTER_BADGE_TONES: Record<FormFooterBadgeTone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export interface FormFooterEntityChipProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * Entity "name" chip in form footers (linked contact / session / teacher name).
 * SSOT for the muted name-badge markup (Contacts / Students / Teachers / Sessions / QB).
 */
export function FormFooterEntityChip({
  children,
  className,
  title,
}: FormFooterEntityChipProps): React.JSX.Element {
  return (
    <span
      title={title}
      className={cn(
        "font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface FormFooterBadgeProps {
  children: ReactNode;
  tone?: FormFooterBadgeTone;
  className?: string;
  title?: string;
}

/**
 * Small tone badge in form footers (e.g. "2 phones", "Employee ID", session type/status).
 * SSOT for the `bg-{tone}/10 … border-{tone}/20` badge markup.
 */
export function FormFooterBadge({
  children,
  tone = "primary",
  className,
  title,
}: FormFooterBadgeProps): React.JSX.Element {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md font-semibold border text-xs",
        FORM_FOOTER_BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface FormFooterErrorChipProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * Destructive "required" chip in form footers (e.g. first name required, contact required).
 * SSOT for the `bg-destructive/10 … border-destructive/20` error chip markup.
 */
export function FormFooterErrorChip({
  children,
  className,
  title,
}: FormFooterErrorChipProps): React.JSX.Element {
  return (
    <span
      role="status"
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20",
        className,
      )}
    >
      {children}
    </span>
  );
}
