import React from 'react';
import type { AppTranslationKey } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const SETTINGS_WIDTH = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl',
  wide: 'max-w-4xl',
} as const;

interface SettingsPanelProps {
  width?: keyof typeof SETTINGS_WIDTH;
  /** Translation key for supplementary panel copy (`*Desc` sibling). */
  introKey: AppTranslationKey;
  isDirty?: boolean;
  saved?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Consistent settings tab shell — intro, status, content, sticky actions.
 */
export function SettingsPanel({
  width = 'medium',
  introKey,
  isDirty = false,
  saved = false,
  children,
  footer,
}: SettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const introDescKey = `${introKey}Desc` as AppTranslationKey;

  return (
    <div className={cn(SETTINGS_WIDTH[width], 'space-y-5 pb-2')}>
      <SettingsPanelIntro description={t(introDescKey)} />
      <SettingsStatusBadges isDirty={isDirty} saved={saved} />
      <div className="space-y-5">{children}</div>
      {footer}
    </div>
  );
}

interface SettingsPanelIntroProps {
  description: string;
  className?: string;
}

export function SettingsPanelIntro({ description, className }: SettingsPanelIntroProps): React.JSX.Element {
  return (
    <p
      className={cn(
        'rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5',
        className,
      )}
    >
      {description}
    </p>
  );
}

export function SettingsStatusBadges({
  isDirty,
  saved,
}: {
  isDirty: boolean;
  saved: boolean;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!isDirty && !saved) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2',
        isDirty
          ? 'border-warning/30 bg-warning/5'
          : 'border-border/60 bg-muted/20',
      )}
      aria-live="polite"
    >
      {isDirty ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
          {t('settings.unsavedChanges')}
        </span>
      ) : null}
      {saved && !isDirty ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
          {t('settings.savedBadge')}
        </span>
      ) : null}
    </div>
  );
}

interface SettingsToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SettingsToggleRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border px-3.5 py-3.5 transition-colors',
        checked
          ? 'border-primary/20 bg-primary/5'
          : 'border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20',
      )}
    >
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground cursor-pointer">
          {label}
        </Label>
        {description ? (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
    </div>
  );
}

export function SettingsFieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

export function SettingsCallout({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning';
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
        variant === 'warning'
          ? 'border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/20 dark:text-warning'
          : 'border-border bg-muted/30 text-muted-foreground',
      )}
    >
      {children}
    </div>
  );
}

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
        'rounded-md border px-2 py-0.5 text-[11px] font-medium',
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
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
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
