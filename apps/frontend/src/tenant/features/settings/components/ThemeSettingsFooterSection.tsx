import React from 'react';
import { Wand2 } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FieldHint, FOOTER_MAX } from '@/tenant/features/settings/components/branding/BrandingShared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export interface ThemeSettingsFooterSectionProps {
  t: TranslationFunction;
  footerText: string;
  footerPreview: string;
  defaultFooterPreview: string;
  logoUrl: string;
  madrasaName: string;
  onFooterChange: (value: string) => void;
  onGenerateFooter: () => void;
}

export function ThemeSettingsFooterSection({
  t,
  footerText,
  footerPreview,
  defaultFooterPreview,
  logoUrl,
  madrasaName,
  onFooterChange,
  onGenerateFooter,
}: ThemeSettingsFooterSectionProps): React.JSX.Element {
  return (
    <SectionCard
      title={t('theme.footerTitle')}
      subtitle={t('theme.footerSubtitle')}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={onGenerateFooter}>
          <Wand2 className="h-3.5 w-3.5" />
          {t('theme.footerGenerate')}
        </Button>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="footerText">{t('theme.footerLabel')}</Label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {footerText.length}/{FOOTER_MAX}
          </span>
        </div>
        <Textarea
          id="footerText"
          value={footerText}
          maxLength={FOOTER_MAX}
          rows={2}
          placeholder={defaultFooterPreview}
          aria-describedby="footerText-hint"
          onChange={(event) => onFooterChange(event.target.value)}
        />
        <FieldHint id="footerText-hint">{t('theme.footerHint')}</FieldHint>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">{t('theme.authPreviewLabel')}</p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 border-b border-border bg-muted/20 px-6 py-8">
            {logoUrl.trim() ? (
              <img
                src={logoUrl}
                alt={t('theme.authPreviewLogoAlt')}
                className="h-12 w-12 rounded-lg border border-border object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                {t('theme.authPreviewLogoPlaceholder')}
              </div>
            )}
            <p className="text-sm font-semibold text-foreground">
              {madrasaName.trim() || t('theme.authPreviewNamePlaceholder')}
            </p>
          </div>
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">{footerPreview}</p>
        </div>
      </div>
    </SectionCard>
  );
}
