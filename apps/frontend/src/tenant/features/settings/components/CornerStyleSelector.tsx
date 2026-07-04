import React from 'react';
import {
  BRANDING_CORNER_RADIUS,
  BRANDING_CORNER_STYLE_OPTIONS,
  BRANDING_CORNER_STYLE_VALUES,
  resolveBrandingCornerRadius,
  type BrandingCornerStyle,
  type BrandingCornerPreset,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface CornerStyleSelectorProps {
  value: BrandingCornerStyle;
  onChange: (style: BrandingCornerStyle) => void;
}

function parseRadiusToPx(value: string): number {
  if (value === 'sharp') return 2;
  if (value === 'subtle') return 6;
  if (value === 'rounded') return 10;
  if (value === 'soft') return 16;

  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 10;

  if (value.includes('rem') || value.includes('em')) {
    return Math.round(parsed * 16);
  }
  return Math.round(parsed);
}

/**
 * Tenant corner roundness — maps to CSS `--radius` (cards, inputs, buttons).
 * Fully adjustable slider with quick presets.
 */
export default function CornerStyleSelector({
  value,
  onChange,
}: CornerStyleSelectorProps): React.JSX.Element {
  const { t } = useTranslation();

  const currentPx = parseRadiusToPx(value);

  // Helper to determine if a pixel value matches a preset
  const getPresetForPx = (px: number): BrandingCornerPreset | null => {
    if (px === 2) return 'sharp';
    if (px === 6) return 'subtle';
    if (px === 10) return 'rounded';
    if (px === 16) return 'soft';
    return null;
  };

  const matchedPreset = getPresetForPx(currentPx);
  const activeOption = matchedPreset
    ? BRANDING_CORNER_STYLE_OPTIONS.find((opt) => opt.value === matchedPreset)
    : null;

  const handleSliderChange = (values: number[]): void => {
    const val = values[0];
    const preset = getPresetForPx(val);
    if (preset) {
      onChange(preset);
    } else {
      onChange(`${val}px`);
    }
  };

  const resolvedRadius = resolveBrandingCornerRadius(value);

  return (
    <div className="flex flex-col gap-6 p-5 bg-card/45 backdrop-blur-sm rounded-2xl border border-border/80 shadow-xs">
      {/* Live Preview Box */}
      <div 
        className="flex items-center justify-center py-8 bg-muted/10 rounded-xl border border-border/40 relative overflow-hidden transition-all duration-300"
        aria-hidden="true"
      >
        <div
          className="w-32 h-20 bg-primary/10 border border-primary/20 flex flex-col items-center justify-center gap-2 shadow-xs transition-all duration-300"
          style={{ borderRadius: resolvedRadius }}
        >
          <div
            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold shadow-sm transition-all duration-300"
            style={{ borderRadius: resolvedRadius }}
          >
            {matchedPreset && activeOption
              ? t(activeOption.labelKey) 
              : t('theme.cornerCustom', { radius: resolvedRadius })}
          </div>
          <span className="text-[9px] text-muted-foreground font-mono">
            {resolvedRadius}
          </span>
        </div>
      </div>

      {/* Slider Track Container */}
      <div className="space-y-4 px-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-muted-foreground">{t('theme.cornerPreviewRadius')}</span>
          <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
            {resolvedRadius}
          </span>
        </div>

        <Slider
          min={0}
          max={24}
          step={1}
          value={[currentPx]}
          onValueChange={handleSliderChange}
          aria-label={t('theme.cornerStyleTitle')}
          className="py-2"
        />

        {/* Step Snap Preset Buttons */}
        <div className="flex justify-between px-0.5">
          {BRANDING_CORNER_STYLE_OPTIONS.map((opt) => {
            const isSelected = matchedPreset === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring p-1 rounded-sm",
                  isSelected 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed m-0 text-center px-1">
        {matchedPreset && activeOption
          ? t(activeOption.descriptionKey)
          : t('theme.cornerStyleHint')}
      </p>
    </div>
  );
}
