import React, { useRef } from 'react';
import { Palette, ImageIcon, Loader2, Sparkles, Copy, Upload, X } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BrandColorPanel from '@/components/branding/BrandColorPanel';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { BrandingThemeMode, LogoColorProportion } from '@mms/shared';
import { notify } from '@/lib/notify';

export interface ThemeSettingsColoursSectionProps {
  t: TranslationFunction;
  logoUrl: string;
  isSample?: boolean;
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  extractedPalette?: readonly string[];
  proportions?: readonly LogoColorProportion[];
  bestPair?: { primary: string; secondary: string } | null;
  applyingLogoColors: boolean;
  onApplyLogoColors: () => void;
  onApplyBestPair?: () => void;
  onSetSampleLogo?: (dataUrl: string) => void;
  onClearSampleLogo?: () => void;
  onGoToInstitution: () => void;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onApplyPreset: (primary: string, secondary: string) => void;
}

export function ThemeSettingsColoursSection({
  t,
  logoUrl,
  isSample = false,
  primaryColor,
  secondaryColor,
  previewMode,
  extractedPalette = [],
  proportions = [],
  bestPair = null,
  applyingLogoColors,
  onApplyLogoColors,
  onApplyBestPair,
  onSetSampleLogo,
  onClearSampleLogo,
  onGoToInstitution,
  onPrimaryChange,
  onSecondaryChange,
  onApplyPreset,
}: ThemeSettingsColoursSectionProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSampleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSetSampleLogo?.(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <SectionCard
      title={t('theme.coloursTitle')}
      subtitle={t('theme.coloursSubtitle')}
      icon={Palette}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={applyingLogoColors || !logoUrl.trim()}
            onClick={onApplyLogoColors}
            className="min-h-11 px-3 text-xs"
          >
            {applyingLogoColors ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" aria-hidden />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 me-1.5" aria-hidden />
            )}
            {applyingLogoColors ? t('theme.applyingLogoColors') : t('theme.applyLogoColors')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGoToInstitution}
            className="min-h-11 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            {t('theme.goToInstitution')}
          </Button>
        </div>
      }
    >
      {logoUrl.trim() ? (
        <div className="mb-4 space-y-3 rounded-xl border border-border/80 bg-muted/30 backdrop-blur-sm p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logoUrl}
                alt={t('theme.logoSourceAlt')}
                className="h-12 w-12 shrink-0 rounded-lg border border-border object-contain bg-background p-1 shadow-sm"
              />
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    {isSample ? t('theme.sampleImageBadge') : t('branding.logo')}
                  </p>
                  {isSample && (
                    <Badge variant="outline" className="text-3xs px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                      {t('theme.sampleImageBadge')}
                    </Badge>
                  )}
                </div>
                <p className="text-2xs text-muted-foreground leading-relaxed truncate">
                  {isSample ? t('theme.testLogoDropzone') : t('theme.logoSourceHint')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isSample ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearSampleLogo}
                  className="h-8 min-h-8 px-2 text-2xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5 me-1" />
                  {t('theme.clearSampleLogo')}
                </Button>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSampleFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 min-h-8 px-2 text-2xs font-semibold text-muted-foreground hover:text-foreground"
                    title={t('theme.testLogoButton')}
                  >
                    <Upload className="h-3 w-3 me-1" />
                    {t('theme.testLogoButton')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Proportional Logo Color Spectrum Bar */}
          {proportions.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between text-3xs font-semibold text-muted-foreground">
                <span>{t('theme.autoExtractedTitle')}</span>
                <span className="font-mono">
                  {proportions.slice(0, 4).map((p) => `${p.hex.toUpperCase()} (${p.percentage}%)`).join(' · ')}
                </span>
              </div>
              <div className="h-3 w-full flex rounded-md overflow-hidden border border-border/60 bg-muted/40 shadow-inner">
                {proportions.map((item, i) => (
                  <div
                    key={`prop-${item.hex}-${i}`}
                    style={{ width: `${item.percentage}%`, backgroundColor: item.hex }}
                    title={`${item.hex} (${item.percentage}%) — click to copy`}
                    className="h-full transition-all duration-300 hover:opacity-90 cursor-pointer"
                    onClick={() => {
                      void navigator.clipboard?.writeText(item.hex);
                      notify.success(t('theme.copiedHex', { hex: item.hex }));
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-dashed border-border bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">{t('theme.logoSourceMissing')}</p>
            <p className="text-2xs text-muted-foreground">{t('theme.testLogoDropzone')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSampleFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 px-3 text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5 me-1.5" />
              {t('theme.testLogoButton')}
            </Button>
          </div>
        </div>
      )}

      {/* Extracted Logo Swatches Tray */}
      {extractedPalette.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t('theme.logoExtractedPalette')}
            </span>
            <div className="flex items-center gap-2">
              {bestPair && onApplyBestPair && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onApplyBestPair}
                  className="h-7 min-h-7 px-2 text-2xs font-bold text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 rounded-md"
                >
                  <Sparkles className="h-3 w-3 me-1" />
                  {t('theme.applyLogoPair')}
                </Button>
              )}
              <span className="text-3xs font-medium text-muted-foreground">{extractedPalette.length} swatches</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {extractedPalette.map((hex, idx) => (
              <div
                key={`${hex}-${idx}`}
                className="flex items-center gap-1.5 p-1 pe-2 rounded-lg border border-border/80 bg-card shadow-2xs transition-all hover:border-primary/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(hex);
                    notify.success(t('theme.copiedHex', { hex }));
                  }}
                  title={t('theme.copiedHex', { hex })}
                  className="h-7 w-7 rounded-md border border-white/20 shadow-2xs shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group relative"
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                >
                  <Copy className="h-3 w-3 text-white/0 group-hover:text-white/90 drop-shadow-sm transition-colors" />
                </button>
                <span className="font-mono text-2xs text-muted-foreground font-semibold px-0.5">{hex}</span>
                <div className="flex items-center gap-1 ps-1 border-s border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPrimaryChange(hex)}
                    className="h-6 min-h-6 px-1.5 text-3xs font-bold text-primary hover:bg-primary/10 rounded-md"
                    title={t('theme.setAsPrimary')}
                  >
                    {t('theme.setAsPrimary')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSecondaryChange(hex)}
                    className="h-6 min-h-6 px-1.5 text-3xs font-bold text-muted-foreground hover:text-foreground rounded-md"
                    title={t('theme.setAsAccent')}
                  >
                    {t('theme.setAsAccent')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BrandColorPanel
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        previewMode={previewMode}
        onPrimaryChange={onPrimaryChange}
        onSecondaryChange={onSecondaryChange}
        onApplyPreset={onApplyPreset}
      />
    </SectionCard>
  );
}
