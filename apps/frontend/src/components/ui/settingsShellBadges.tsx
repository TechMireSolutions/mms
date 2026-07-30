import React from 'react';
import { cn } from '@/lib/utils';

const META_BADGE_STYLES = {
  primary: 'border-primary/30 bg-primary/10 text-primary',
  muted: 'border-border bg-muted text-muted-foreground',
  warning:
    'border-warning/40 bg-warning/10 text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning',
  success:
    'border-success/40 bg-success/10 text-success dark:border-success/40 dark:bg-success/20 dark:text-success',
  destructive:
    'border-destructive/40 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20 dark:text-destructive',
} as const;

/** Compact status chip for settings section summaries. */
export function SettingsMetaBadge({
  variant = 'muted',
  children,
}: {
  variant?: keyof typeof META_BADGE_STYLES;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-xs font-medium',
        META_BADGE_STYLES[variant],
      )}
    >
      {children}
    </span>
  );
}

/** Primary + accent swatches with hex values for theme summary rows. */
export function SettingsColoursBadge({
  primaryColor,
  secondaryColor,
  ariaLabel,
}: {
  primaryColor: string;
  secondaryColor: string;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
      aria-label={ariaLabel}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />
      <span>{primaryColor}</span>
      <span aria-hidden>·</span>
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: secondaryColor }}
        aria-hidden
      />
      <span>{secondaryColor}</span>
    </span>
  );
}
