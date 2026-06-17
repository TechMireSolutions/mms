import React, { useMemo } from 'react';
import { AlertTriangle, Check, Sparkles, Wand2 } from 'lucide-react';
import {
  BRANDING_THEME_PRESETS,
  buildBrandingCssVariables,
  brandingTokenToCss,
  getContrastRatio,
  meetsWcagAaTextContrast,
  meetsWcagAaUiContrast,
  normalizeBrandingHex,
  resolveBrandingChartPaletteHex,
  suggestSecondaryColor,
  hexToHslColor,
  hslColorToHex,
  tone,
  type AppTranslationKey,
  type BrandingThemeMode,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { SettingsMetaBadge } from '@/components/settings/SettingsShared';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function primaryForegroundHex(primaryHex: string): string {
  const hsl = hexToHslColor(primaryHex);
  if (!hsl) return '#ffffff';
  return hsl.l > 52 ? hslColorToHex(tone(hsl, { s: -20, l: -42 })) : '#ffffff';
}

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
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-0.5"
        />
        <Input
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
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

const DERIVED_SWATCHES: { labelKey: AppTranslationKey; token: keyof ReturnType<typeof buildBrandingCssVariables> }[] = [
  { labelKey: 'theme.tokenPrimary', token: '--primary' },
  { labelKey: 'theme.tokenAccent', token: '--secondary' },
  { labelKey: 'theme.tokenMuted', token: '--muted' },
  { labelKey: 'theme.tokenBorder', token: '--border' },
  { labelKey: 'theme.tokenSuccess', token: '--success' },
  { labelKey: 'theme.tokenChart1', token: '--chart-1' },
  { labelKey: 'theme.tokenChart2', token: '--chart-2' },
  { labelKey: 'theme.tokenSidebar', token: '--sidebar-background' },
];

function presetPrimaryContrast(primaryHex: string): number | null {
  const fg = primaryForegroundHex(primaryHex);
  return getContrastRatio(fg, primaryHex);
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

  const chartPalette = useMemo(
    () => resolveBrandingChartPaletteHex(primaryColor, secondaryColor, previewMode),
    [primaryColor, secondaryColor, previewMode],
  );

  const onPrimaryFg = primaryForegroundHex(primaryColor);
  const primaryContrast = getContrastRatio(onPrimaryFg, primaryColor);
  const secondaryContrast = getContrastRatio('#ffffff', secondaryColor);

  const isPresetActive = (primary: string, secondary: string): boolean =>
    primaryColor === primary && secondaryColor === secondary;

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
      <div className="space-y-2">
        <Label>{t('theme.palettesTitle')}</Label>
        <p className="text-xs text-muted-foreground">{t('theme.palettesDesc')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BRANDING_THEME_PRESETS.map((preset) => {
            const active = isPresetActive(preset.primaryColor, preset.secondaryColor);
            const presetContrast = presetPrimaryContrast(preset.primaryColor);
            const lowContrast =
              presetContrast !== null && !meetsWcagAaUiContrast(presetContrast);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.primaryColor, preset.secondaryColor)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all hover:border-primary/40',
                  active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-muted/20',
                )}
              >
                <span
                  className="relative h-9 w-9 shrink-0 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: preset.primaryColor }}
                >
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background"
                    style={{ backgroundColor: preset.secondaryColor }}
                    aria-hidden
                  />
                  {active ? (
                    <Check
                      className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm"
                      aria-hidden
                    />
                  ) : null}
                  {lowContrast ? (
                    <AlertTriangle
                      className="absolute -left-1 -top-1 h-3 w-3 text-warning drop-shadow-sm dark:text-warning"
                      aria-label={t('theme.presetContrastLow')}
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {t(preset.labelKey)}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {preset.primaryColor}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
            className="text-[10px]"
          >
            {primaryContrastLabel}
          </Badge>
        ) : null}
        {secondaryContrast !== null ? (
          <Badge
            variant={meetsWcagAaUiContrast(secondaryContrast) ? 'secondary' : 'outline'}
            className="text-[10px]"
          >
            {t('theme.contrastAccent', { ratio: secondaryContrast.toFixed(1) })}
          </Badge>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          <p className="text-xs font-semibold text-foreground">{t('theme.semanticPreviewTitle')}</p>
          <p className="text-[10px] text-muted-foreground">{t('theme.semanticPreviewDesc')}</p>
          <span className="ms-auto">
            <SettingsMetaBadge variant="muted">
              {t(previewMode === 'dark' ? 'global.themeDark' : 'global.themeLight')}
            </SettingsMetaBadge>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="space-y-3 border-b border-border p-4 md:border-b-0 md:border-r">
            <button
              type="button"
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm"
              style={{ backgroundColor: primaryColor, color: onPrimaryFg }}
            >
              {t('theme.previewPrimaryAction')}
            </button>
            <button
              type="button"
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: secondaryColor, color: onPrimaryFg, borderColor: secondaryColor }}
            >
              {t('theme.previewAccentAction')}
            </button>
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
              >
                {t('theme.previewStatusBadge')}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: `${secondaryColor}22`, color: secondaryColor }}
              >
                {t('theme.previewAccentBadge')}
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: brandingTokenToCss(tokens['--muted']!),
                borderColor: brandingTokenToCss(tokens['--border']!),
              }}
            >
              <p
                className="text-xs font-medium"
                style={{ color: brandingTokenToCss(tokens['--foreground']!) }}
              >
                {t('theme.previewCardTitle')}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: brandingTokenToCss(tokens['--muted-foreground']!) }}
              >
                {t('theme.previewCardBody')}
              </p>
            </div>
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: brandingTokenToCss(tokens['--sidebar-background']!) }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: brandingTokenToCss(tokens['--sidebar-foreground']!) }}
              >
                {t('theme.previewSidebar')}
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: brandingTokenToCss(tokens['--sidebar-primary']!) }}
                aria-hidden
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground">{t('theme.chartPreviewTitle')}</p>
              <div className="flex gap-1">
                {chartPalette.charts.map((hex, index) => (
                  <span
                    key={`chart-${index}`}
                    className="h-6 flex-1 rounded-md border border-border"
                    style={{ backgroundColor: hex }}
                    aria-label={t('theme.chartPreviewSwatch', { index: index + 1 })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('theme.derivedTokensTitle')}</Label>
        <p className="text-xs text-muted-foreground">{t('theme.derivedTokensDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {DERIVED_SWATCHES.map((swatch) => (
            <div
              key={swatch.labelKey}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2 py-1.5"
            >
              <span
                className="h-5 w-5 shrink-0 rounded-md border border-border"
                style={{ backgroundColor: brandingTokenToCss(tokens[swatch.token]!) }}
                aria-hidden
              />
              <span className="text-[10px] font-medium text-muted-foreground">{t(swatch.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
