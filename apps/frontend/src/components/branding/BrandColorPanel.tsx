import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Copy, Sparkles, Upload, Wand2 } from 'lucide-react';
import {
  BRANDING_HARMONY_SCHEMES,
  brandingTokenToHex,
  buildBrandingCssVariables,
  ensureAccessibleBrandColor,
  getContrastRatio,
  meetsWcagAaTextContrast,
  normalizeBrandingHex,
  suggestHarmoniousSecondaryColor,
  type BrandingHarmonyScheme,
  type BrandingThemeMode,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandDerivedTokens, BrandPresetPicker, BrandSemanticPreview } from '@/components/branding/BrandColorPanelSections';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';

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

  const isValidHex = /^#([0-9a-fA-F]{3}){1,2}$/.test(
    hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`
  );

  const commitHex = (): void => {
    const prefixed = hexDraft.trim().startsWith('#') ? hexDraft.trim() : `#${hexDraft.trim()}`;
    const normalized = normalizeBrandingHex(prefixed, value);
    if (normalized !== value || hexDraft.trim()) {
      React.startTransition(() => {
        onChange(normalized);
      });
      setHexDraft(normalized);
      return;
    }
    setHexDraft(value);
  };

  return (
    <div className={`${WORK_SURFACE} space-y-2 p-4`}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          aria-label={label}
          onChange={(event) => {
            const next = event.target.value.toLowerCase();
            setHexDraft(next);
            React.startTransition(() => {
              onChange(next);
            });
          }}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-0.5 transition-transform hover:scale-105"
        />
        <div className="relative flex-1">
          <Input
            value={hexDraft}
            onChange={(event) => {
              const val = event.target.value;
              setHexDraft(val);
              const testHex = val.startsWith('#') ? val : `#${val}`;
              if (/^#([0-9a-fA-F]{6})$/.test(testHex)) {
                React.startTransition(() => {
                  onChange(testHex.toLowerCase());
                });
              }
            }}
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
            className={cn(
              'h-11 min-h-11 font-mono text-xs pe-8',
              !isValidHex && hexDraft.trim() && 'border-destructive/80 focus-visible:ring-destructive/30'
            )}
            aria-label={t('theme.hexAria', { label })}
          />
          {isValidHex && (
            <span
              className="absolute end-2.5 top-3.5 h-4 w-4 rounded-full border border-white/20 shadow-2xs transition-transform hover:scale-110"
              style={{ backgroundColor: hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}` }}
              aria-hidden="true"
            />
          )}
        </div>
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

  const tokens = useMemo(
    () => buildBrandingCssVariables(primaryColor, secondaryColor, previewMode),
    [primaryColor, secondaryColor, previewMode],
  );

  // Dual-mode tokens for simultaneous light & dark accessibility evaluation
  const lightTokens = useMemo(
    () => buildBrandingCssVariables(primaryColor, secondaryColor, 'light'),
    [primaryColor, secondaryColor],
  );
  const darkTokens = useMemo(
    () => buildBrandingCssVariables(primaryColor, secondaryColor, 'dark'),
    [primaryColor, secondaryColor],
  );

  const onPrimaryBg = brandingTokenToHex(tokens['--primary'] ?? '', primaryColor);
  const onPrimaryFg = brandingTokenToHex(tokens['--primary-foreground'] ?? '', '#ffffff');
  const onSecondaryBg = brandingTokenToHex(tokens['--secondary'] ?? '', secondaryColor);
  const onSecondaryFg = brandingTokenToHex(tokens['--secondary-foreground'] ?? '', '#ffffff');

  // Light mode contrast
  const lightPrimaryBg = brandingTokenToHex(lightTokens['--primary'] ?? '', primaryColor);
  const lightPrimaryFg = brandingTokenToHex(lightTokens['--primary-foreground'] ?? '', '#ffffff');
  const lightPrimaryContrast = getContrastRatio(lightPrimaryFg, lightPrimaryBg);
  const lightPrimaryPasses = meetsWcagAaTextContrast(lightPrimaryContrast);

  const lightSecondaryBg = brandingTokenToHex(lightTokens['--secondary'] ?? '', secondaryColor);
  const lightSecondaryFg = brandingTokenToHex(lightTokens['--secondary-foreground'] ?? '', '#ffffff');
  const lightSecondaryContrast = getContrastRatio(lightSecondaryFg, lightSecondaryBg);
  const lightSecondaryPasses = meetsWcagAaTextContrast(lightSecondaryContrast);

  // Dark mode contrast
  const darkPrimaryBg = brandingTokenToHex(darkTokens['--primary'] ?? '', primaryColor);
  const darkPrimaryFg = brandingTokenToHex(darkTokens['--primary-foreground'] ?? '', '#ffffff');
  const darkPrimaryContrast = getContrastRatio(darkPrimaryFg, darkPrimaryBg);
  const darkPrimaryPasses = meetsWcagAaTextContrast(darkPrimaryContrast);

  const darkSecondaryBg = brandingTokenToHex(darkTokens['--secondary'] ?? '', secondaryColor);
  const darkSecondaryFg = brandingTokenToHex(darkTokens['--secondary-foreground'] ?? '', '#ffffff');
  const darkSecondaryContrast = getContrastRatio(darkSecondaryFg, darkSecondaryBg);
  const darkSecondaryPasses = meetsWcagAaTextContrast(darkSecondaryContrast);

  const primaryBothPass = lightPrimaryPasses && darkPrimaryPasses;
  const secondaryBothPass = lightSecondaryPasses && darkSecondaryPasses;

  const handleCopyPalette = (): void => {
    const payload = JSON.stringify({ primary: primaryColor, accent: secondaryColor }, null, 2);
    void navigator.clipboard.writeText(payload);
    notify.success(t('theme.paletteCopied'));
  };

  const [isImporting, setIsImporting] = useState(false);
  const [importRawText, setImportRawText] = useState('');

  const parseImportCandidate = (raw: string): { primary: string; secondary: string } | null => {
    if (!raw.trim()) return null;
    try {
      const trimmed = raw.trim();
      let primary = '';
      let secondary = '';

      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed) as { primary?: string; accent?: string; secondary?: string };
        primary = parsed.primary ?? '';
        secondary = parsed.accent ?? parsed.secondary ?? '';
      } else if (trimmed.includes(',') || trimmed.includes(' ')) {
        const parts = trimmed.split(/[, ]+/).map((p) => p.trim()).filter(Boolean);
        primary = parts[0] ?? '';
        secondary = parts[1] ?? '';
      }

      const normPrimary = normalizeBrandingHex(primary, '');
      const normSecondary = normalizeBrandingHex(secondary, '');

      if (!normPrimary || !normSecondary) return null;
      return { primary: normPrimary, secondary: normSecondary };
    } catch {
      return null;
    }
  };

  const parsedCandidate = parseImportCandidate(importRawText);

  const handleConfirmImport = (): void => {
    if (!parsedCandidate) return;
    onPrimaryChange(parsedCandidate.primary);
    onSecondaryChange(parsedCandidate.secondary);
    setIsImporting(false);
    setImportRawText('');
    notify.success(t('theme.pastePaletteSuccess'));
  };

  return (
    <div className="space-y-5">
      {/* Import Palette Modal */}
      <Modal
        open={isImporting}
        onClose={() => {
          setIsImporting(false);
          setImportRawText('');
        }}
        title={t('theme.importPaletteTitle')}
        subtitle={t('theme.importPaletteDesc')}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsImporting(false);
                setImportRawText('');
              }}
              className="min-h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={!parsedCandidate}
              onClick={handleConfirmImport}
              className="min-h-10 px-4 text-xs font-semibold"
            >
              {t('theme.importPaletteAction')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="import-palette-input">{t('theme.importPaletteInputLabel')}</Label>
            <Textarea
              id="import-palette-input"
              value={importRawText}
              onChange={(e) => setImportRawText(e.target.value)}
              placeholder={t('theme.importPalettePlaceholder')}
              rows={4}
              autoFocus
              className="font-mono text-xs"
            />
          </div>

          {parsedCandidate ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/30 animate-in fade-in duration-200">
              <div className="flex items-center -space-x-2">
                <span
                  className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                  style={{ backgroundColor: parsedCandidate.primary }}
                />
                <span
                  className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                  style={{ backgroundColor: parsedCandidate.secondary }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {parsedCandidate.primary} & {parsedCandidate.secondary}
                </p>
                <p className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  Valid palette detected
                </p>
              </div>
            </div>
          ) : importRawText.trim() ? (
            <p className="text-xs text-destructive font-medium px-1">
              {t('theme.pastePaletteInvalid')}
            </p>
          ) : null}
        </div>
      </Modal>

      <BrandPresetPicker
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        previewMode={previewMode}
        onApplyPreset={onApplyPreset}
      />

      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
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

        {/* Quick Swap Button centered between fields on desktop */}
        <div className="hidden lg:flex absolute left-1/2 top-10 -translate-x-1/2 z-10">
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
        {/* Row 1: Harmony & Palette Share/Import */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Harmony Scheme Picker & Swap */}
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
                    {t(scheme.labelKey as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Palette Code Share & Import */}
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

        {/* Row 2: WCAG Accessibility & Contrast Badges */}
        {(lightPrimaryContrast !== null || lightSecondaryContrast !== null) && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground me-0.5 shrink-0">
                {t('theme.wcagContrast')}:
              </span>

              {/* Dual-Mode Contrast Indicator for Primary */}
              {lightPrimaryContrast !== null && darkPrimaryContrast !== null && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-mono whitespace-nowrap shadow-2xs transition-all",
                      primaryBothPass
                        ? "border-border/80 bg-card text-foreground"
                        : "border-warning/50 bg-warning/5 text-warning-foreground"
                    )}
                    title={primaryBothPass ? t('theme.contrastBothPass') : t('theme.contrastBothFail')}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/20 shadow-2xs"
                      style={{ backgroundColor: primaryColor }}
                      aria-hidden="true"
                    />
                    <span className="font-bold">P:</span>
                    <span>
                      {t('theme.contrastDualSummary', {
                        lightRatio: lightPrimaryContrast.toFixed(1),
                        darkRatio: darkPrimaryContrast.toFixed(1),
                      })}
                    </span>
                  </div>
                  {!primaryBothPass && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onPrimaryChange(ensureAccessibleBrandColor(primaryColor, 4.5))}
                      className="h-8 min-h-8 px-2 text-2xs font-semibold text-primary whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="h-3 w-3 me-1 shrink-0" />
                      {t('theme.autoFixContrast')}
                    </Button>
                  )}
                </div>
              )}

              {/* Dual-Mode Contrast Indicator for Accent */}
              {lightSecondaryContrast !== null && darkSecondaryContrast !== null && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-mono whitespace-nowrap shadow-2xs transition-all",
                      secondaryBothPass
                        ? "border-border/80 bg-card text-foreground"
                        : "border-warning/50 bg-warning/5 text-warning-foreground"
                    )}
                    title={secondaryBothPass ? t('theme.contrastBothPass') : t('theme.contrastBothFail')}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/20 shadow-2xs"
                      style={{ backgroundColor: secondaryColor }}
                      aria-hidden="true"
                    />
                    <span className="font-bold">A:</span>
                    <span>
                      {t('theme.contrastDualSummary', {
                        lightRatio: lightSecondaryContrast.toFixed(1),
                        darkRatio: darkSecondaryContrast.toFixed(1),
                      })}
                    </span>
                  </div>
                  {!secondaryBothPass && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSecondaryChange(ensureAccessibleBrandColor(secondaryColor, 4.5))}
                      className="h-8 min-h-8 px-2 text-2xs font-semibold text-primary whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="h-3 w-3 me-1 shrink-0" />
                      {t('theme.autoFixContrast')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
