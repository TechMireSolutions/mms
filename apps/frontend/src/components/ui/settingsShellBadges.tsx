import React from 'react';
import { Badge, type BadgeTone } from '@/components/ui/badge';

const META_TO_TONE: Record<string, BadgeTone> = {
  primary: 'primary',
  muted: 'muted',
  warning: 'warning',
  success: 'success',
  destructive: 'destructive',
};

/** Compact status chip for settings — thin adapter over shared Badge. */
export function SettingsMetaBadge({
  variant = 'muted',
  children,
}: {
  variant?: keyof typeof META_TO_TONE;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Badge as="span" tone={META_TO_TONE[variant] ?? 'muted'} size="sm">
      {children}
    </Badge>
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
