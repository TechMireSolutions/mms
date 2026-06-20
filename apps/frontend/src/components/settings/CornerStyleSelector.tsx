import React from 'react';
import {
  BRANDING_CORNER_RADIUS,
  BRANDING_CORNER_STYLE_OPTIONS,
  type BrandingCornerStyle,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface CornerStyleSelectorProps {
  value: BrandingCornerStyle;
  onChange: (style: BrandingCornerStyle) => void;
}

/**
 * Tenant corner roundness — maps to CSS `--radius` (cards, inputs, buttons).
 */
export default function CornerStyleSelector({
  value,
  onChange,
}: CornerStyleSelectorProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="radiogroup"
      aria-label={t('theme.cornerStyleTitle')}
    >
      {BRANDING_CORNER_STYLE_OPTIONS.map((option) => {
        const active = value === option.value;
        const radius = BRANDING_CORNER_RADIUS[option.value];
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-[88px] flex-col items-center gap-2 rounded-xl border p-3 text-left transition-all',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/30',
            )}
          >
            <span
              className="flex h-10 w-full items-center justify-center border border-border bg-card"
              style={{ borderRadius: radius }}
              aria-hidden
            >
              <span
                className="h-3 w-8 bg-primary"
                style={{ borderRadius: radius }}
              />
            </span>
            <span className="w-full text-center">
              <span className="block text-xs font-semibold text-foreground">{t(option.labelKey)}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                {t(option.descriptionKey)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
