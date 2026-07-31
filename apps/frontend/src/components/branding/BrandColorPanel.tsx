import React, { useMemo } from 'react';
import { Wand2 } from 'lucide-react';
import {
  brandingTokenToHex,
  buildBrandingCssVariables,
  getContrastRatio,
  meetsWcagAaTextContrast,
  meetsWcagAaUiContrast,
  normalizeBrandingHex,
  suggestSecondaryColor,
  type BrandingThemeMode,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandDerivedTokens, BrandPresetPicker, BrandSemanticPreview } from '@/components/branding/BrandColorPanelSections';

interface ColorFieldProps {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorField({ id, label, description, value, onChange }: ColorFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const [hexDraft, setHexDraft] = React.useState(value);

  React.useEffect(() => {
    setHexDraft(value);
  }, [value]);

  const commitHex = (): void => {
    const normalized = normalizeBrandingHex(hexDraft, value);
    if (normalized !== value || hexDraft.trim()) {
      onChange(normalized);
      setHexDraft(normalized);
      return;
    }
    setHexDraft(value);
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/50 p-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-0.5"
        />
        <Input
          value={hexDraft}
          onChange={(event) => setHexDraft(event.target.value)}
          onBlur={commitHex}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitHex();
            }
          }}
          placeholder={t('theme.hexPlaceholder')}
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-xs"
          aria-label={t('theme.hexAria', { label })}
        />
      </div>
    </div>
  );
}

interface BrandColorPanelProps {
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onApplyPreset: (primary: string, secondary: string) => void;
}

/**
 * Brand colour editor — paired palettes, accessibility checks, and semantic preview.
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

  const tokens = useMemo(
    () => buildBrandingCssVariables(primaryColor, secondaryColor, previewMode),
    [primaryColor, secondaryColor, previewMode],
  );

  const onPrimaryBg = brandingTokenToHex(tokens['--primary'] ?? '', primaryColor);
  const onPrimaryFg = brandingTokenToHex(tokens['--primary-foreground'] ?? '', '#ffffff');
  const onSecondaryBg = brandingTokenToHex(tokens['--secondary'] ?? '', secondaryColor);
  const onSecondaryFg = brandingTokenToHex(tokens['--secondary-foreground'] ?? '', '#ffffff');
  const primaryContrast = getContrastRatio(onPrimaryFg, onPrimaryBg);
  const secondaryContrast = getContrastRatio(onSecondaryFg, onSecondaryBg);

  const primaryContrastLabel =
    primaryContrast !== null
      ? `${t('theme.contrastPrimary', { ratio: primaryContrast.toFixed(1) })}${
          meetsWcagAaTextContrast(primaryContrast)
            ? t('theme.contrastAaText')
            : meetsWcagAaUiContrast(primaryContrast)
              ? t('theme.contrastAaUi')
              : t('theme.contrastLow')
        }`
      : '';

  return (
    <div className="space-y-5">
      <BrandPresetPicker
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        previewMode={previewMode}
        onApplyPreset={onApplyPreset}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ColorField
          id="primaryColor"
          label={t('theme.primaryColourLabel')}
          description={t('theme.primaryColourDesc')}
          value={primaryColor}
          onChange={onPrimaryChange}
        />
        <ColorField
          id="secondaryColor"
          label={t('theme.accentColourLabel')}
          description={t('theme.accentColourDesc')}
          value={secondaryColor}
          onChange={onSecondaryChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSecondaryChange(suggestSecondaryColor(primaryColor))}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {t('theme.harmonizeAccent')}
        </Button>
        {primaryContrast !== null ? (
          <Badge
            variant={meetsWcagAaTextContrast(primaryContrast) ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {primaryContrastLabel}
          </Badge>
        ) : null}
        {secondaryContrast !== null ? (
          <Badge
            variant={meetsWcagAaTextContrast(secondaryContrast) ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {t('theme.contrastAccent', { ratio: secondaryContrast.toFixed(1) })}
          </Badge>
        ) : null}
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
