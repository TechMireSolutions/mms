import React, { useState } from 'react';
import { ArrowLeftRight, Copy, Upload, Wand2 } from 'lucide-react';
import {
  BRANDING_HARMONY_SCHEMES,
  brandingTokenToHex,
  buildBrandingCssVariables,
  suggestHarmoniousSecondaryColor,
  type AppTranslationKey,
  type BrandingHarmonyScheme,
  type BrandingThemeMode,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandDerivedTokens, BrandPresetPicker, BrandSemanticPreview } from '@/components/branding/BrandColorPanelSections';
import { BrandColorContrastMatrix } from '@/components/branding/BrandColorContrastMatrix';
import { BrandColorField } from '@/components/branding/BrandColorField';
import { BrandColorImportModal } from '@/components/branding/BrandColorImportModal';
import { notify } from '@/lib/notify';

interface BrandColorPanelProps {
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onApplyPreset: (primary: string, secondary: string) => void;
}

/**
 * Brand colour editor — paired palettes, dual-mode contrast matrix, multi-scheme harmony, and semantic preview.
 */
export default function BrandColorPanel({
  primaryColor,
  secondaryColor,
  previewMode,
  onPrimaryChange,
  onSecondaryChange,
  onApplyPreset,
}: BrandColorPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const [harmonyScheme, setHarmonyScheme] = useState<BrandingHarmonyScheme>('split-complementary');
  const [isImporting, setIsImporting] = useState(false);

  const tokens = (() => buildBrandingCssVariables(primaryColor, secondaryColor, previewMode))();

  const onPrimaryBg = brandingTokenToHex(tokens['--primary'] ?? '', primaryColor);
  const onPrimaryFg = brandingTokenToHex(tokens['--primary-foreground'] ?? '', '#ffffff');
  const onSecondaryBg = brandingTokenToHex(tokens['--secondary'] ?? '', secondaryColor);
  const onSecondaryFg = brandingTokenToHex(tokens['--secondary-foreground'] ?? '', '#ffffff');

  const handleCopyPalette = (): void => {
    const payload = JSON.stringify({ primary: primaryColor, accent: secondaryColor }, null, 2);
    void navigator.clipboard.writeText(payload);
    notify.success(t('theme.paletteCopied'));
  };

  const handleImport = (primary: string, secondary: string): void => {
    onPrimaryChange(primary);
    onSecondaryChange(secondary);
    setIsImporting(false);
  };

  return (
    <div className="space-y-5">
      <BrandColorImportModal
        open={isImporting}
        onClose={() => setIsImporting(false)}
        onImport={handleImport}
      />

      <BrandPresetPicker
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        previewMode={previewMode}
        onApplyPreset={onApplyPreset}
      />

      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BrandColorField
          id="primaryColor"
          label={t('theme.primaryColourLabel')}
          description={t('theme.primaryColourDesc')}
          value={primaryColor}
          onChange={onPrimaryChange}
        />
        <BrandColorField
          id="secondaryColor"
          label={t('theme.accentColourLabel')}
          description={t('theme.accentColourDesc')}
          value={secondaryColor}
          onChange={onSecondaryChange}
        />

        <div className="hidden lg:flex absolute start-1/2 top-10 -translate-x-1/2 rtl:translate-x-1/2 z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onPrimaryChange(secondaryColor);
              onSecondaryChange(primaryColor);
            }}
            title={t('theme.swapColors')}
            aria-label={t('theme.swapColors')}
            className="h-8 w-8 p-0 rounded-full border-border bg-card shadow-sm hover:bg-muted hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onPrimaryChange(secondaryColor);
                onSecondaryChange(primaryColor);
              }}
              title={t('theme.swapColors')}
              className="min-h-11 px-3 text-xs whitespace-nowrap shrink-0 lg:hidden"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 me-1.5 shrink-0" />
              <span>{t('theme.swapColors')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSecondaryChange(suggestHarmoniousSecondaryColor(primaryColor, harmonyScheme))}
              className="min-h-11 px-3 text-xs whitespace-nowrap shrink-0"
            >
              <Wand2 className="h-3.5 w-3.5 me-1.5 shrink-0" />
              <span>{t('theme.harmonizeAccent')}</span>
            </Button>
            <Select
              value={harmonyScheme}
              onValueChange={(val) => {
                const scheme = val as BrandingHarmonyScheme;
                setHarmonyScheme(scheme);
                onSecondaryChange(suggestHarmoniousSecondaryColor(primaryColor, scheme));
              }}
            >
              <SelectTrigger
                aria-label={t('theme.harmonyScheme')}
                className="h-11 min-h-11 w-44 shrink-0 text-xs font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANDING_HARMONY_SCHEMES.map((scheme) => (
                  <SelectItem key={scheme.id} value={scheme.id} className="text-xs">
                    {t(scheme.labelKey as AppTranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPalette}
              className="min-h-11 px-3 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
            >
              <Copy className="h-3.5 w-3.5 me-1.5 shrink-0" />
              <span>{t('theme.copyPalette')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImporting(true)}
              className="min-h-11 px-3 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
            >
              <Upload className="h-3.5 w-3.5 me-1.5 shrink-0" />
              <span>{t('theme.pastePalette')}</span>
            </Button>
          </div>
        </div>

        <BrandColorContrastMatrix
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onPrimaryChange={onPrimaryChange}
          onSecondaryChange={onSecondaryChange}
        />
      </div>

      <BrandSemanticPreview
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        previewMode={previewMode}
        tokens={tokens}
        onPrimaryBg={onPrimaryBg}
        onPrimaryFg={onPrimaryFg}
        onSecondaryBg={onSecondaryBg}
        onSecondaryFg={onSecondaryFg}
      />

      <BrandDerivedTokens tokens={tokens} />
    </div>
  );
}
