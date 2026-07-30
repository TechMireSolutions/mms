import React from 'react';
import { Palette, ImageIcon, Loader2 } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import BrandColorPanel from '@/tenant/features/settings/components/branding/BrandColorPanel';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { BrandingThemeMode } from '@mms/shared';

export interface ThemeSettingsColoursSectionProps {
  t: TranslationFunction;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  applyingLogoColors: boolean;
  onApplyLogoColors: () => void;
  onGoToInstitution: () => void;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onApplyPreset: (primary: string, secondary: string) => void;
}

export function ThemeSettingsColoursSection({
  t,
  logoUrl,
  primaryColor,
  secondaryColor,
  previewMode,
  applyingLogoColors,
  onApplyLogoColors,
  onGoToInstitution,
  onPrimaryChange,
  onSecondaryChange,
  onApplyPreset,
}: ThemeSettingsColoursSectionProps): React.JSX.Element {
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
          >
            {applyingLogoColors ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            )}
            {applyingLogoColors ? t('theme.applyingLogoColors') : t('theme.applyLogoColors')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onGoToInstitution}>
            {t('theme.goToInstitution')}
          </Button>
        </div>
      }
    >
      {logoUrl.trim() ? (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
          <img
            src={logoUrl}
            alt={t('theme.logoSourceAlt')}
            className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain bg-background"
          />
          <p className="text-xs text-muted-foreground">{t('theme.logoSourceHint')}</p>
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">{t('theme.logoSourceMissing')}</p>
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
