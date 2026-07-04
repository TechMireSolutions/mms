import React from 'react';
import {
  BRANDING_CORNER_RADIUS,
  BRANDING_CORNER_STYLE_OPTIONS,
  BRANDING_CORNER_STYLE_VALUES,
  type BrandingCornerStyle,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

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

  const activeIndex = BRANDING_CORNER_STYLE_VALUES.indexOf(value);
  const activeOption =
    BRANDING_CORNER_STYLE_OPTIONS.find((opt) => opt.value === value) ||
    BRANDING_CORNER_STYLE_OPTIONS[2];

  const handleSliderChange = (values: number[]): void => {
    const nextIndex = values[0];
    if (nextIndex >= 0 && nextIndex < BRANDING_CORNER_STYLE_VALUES.length) {
      onChange(BRANDING_CORNER_STYLE_VALUES[nextIndex]);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-card/45 backdrop-blur-sm rounded-2xl border border-border/80 shadow-xs">
      {/* Live Preview Box */}
      <div 
        className="flex items-center justify-center py-7 bg-muted/10 rounded-xl border border-border/40 relative overflow-hidden transition-all duration-300"
        aria-hidden="true"
      >
        <div
          className="w-28 h-18 bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs transition-all duration-300"
          style={{ borderRadius: BRANDING_CORNER_RADIUS[value] }}
        >
          <div
            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold shadow-sm transition-all duration-300"
            style={{ borderRadius: BRANDING_CORNER_RADIUS[value] }}
          >
            {t(activeOption.labelKey)}
          </div>
        </div>
      </div>

      {/* Slider Track Container */}
      <div className="space-y-4 px-1.5">
        <Slider
          min={0}
          max={3}
          step={1}
          value={[activeIndex]}
          onValueChange={handleSliderChange}
          aria-label={t('theme.cornerStyleTitle')}
          className="py-2"
        />

        {/* Step Snap Labels */}
        <div className="flex justify-between px-0.5">
          {BRANDING_CORNER_STYLE_OPTIONS.map((opt, idx) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring p-1 rounded-sm",
                activeIndex === idx 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Current Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed m-0 text-center px-1">
        {t(activeOption.descriptionKey)}
      </p>
    </div>
  );
}
