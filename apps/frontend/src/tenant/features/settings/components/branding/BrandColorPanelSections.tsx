import { AlertTriangle, Check, Sparkles } from "lucide-react";
import {
  BRANDING_THEME_PRESETS,
  brandingTokenToCss,
  brandingTokenToHex,
  buildBrandingCssVariables,
  getContrastRatio,
  meetsWcagAaUiContrast,
  resolveBrandingChartPaletteHex,
  type AppTranslationKey,
  type BrandingThemeMode,
} from "@mms/shared";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SettingsMetaBadge } from "@/components/ui/SettingsShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type BrandingTokens = ReturnType<typeof buildBrandingCssVariables>;

export const DERIVED_SWATCHES: { labelKey: AppTranslationKey; token: keyof BrandingTokens }[] = [
  { labelKey: "theme.tokenPrimary", token: "--primary" },
  { labelKey: "theme.tokenAccent", token: "--secondary" },
  { labelKey: "theme.tokenMuted", token: "--muted" },
  { labelKey: "theme.tokenBorder", token: "--border" },
  { labelKey: "theme.tokenSuccess", token: "--success" },
  { labelKey: "theme.tokenChart1", token: "--chart-1" },
  { labelKey: "theme.tokenChart2", token: "--chart-2" },
  { labelKey: "theme.tokenSidebar", token: "--sidebar-background" },
];

function presetPrimaryContrast(
  primaryHex: string,
  secondaryHex: string,
  previewMode: BrandingThemeMode,
): number | null {
  const tokens = buildBrandingCssVariables(primaryHex, secondaryHex, previewMode);
  const bgHex = brandingTokenToHex(tokens["--primary"] ?? "");
  const fgHex = brandingTokenToHex(tokens["--primary-foreground"] ?? "");
  return getContrastRatio(fgHex, bgHex);
}

interface BrandPresetPickerProps {
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  onApplyPreset: (primary: string, secondary: string) => void;
}

export function BrandPresetPicker({
  primaryColor,
  secondaryColor,
  previewMode,
  onApplyPreset,
}: BrandPresetPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label>{t("theme.palettesTitle")}</Label>
      <p className="text-xs text-muted-foreground">{t("theme.palettesDesc")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BRANDING_THEME_PRESETS.map((preset) => {
          const active = primaryColor === preset.primaryColor && secondaryColor === preset.secondaryColor;
          const presetContrast = presetPrimaryContrast(preset.primaryColor, preset.secondaryColor, previewMode);
          const lowContrast = presetContrast !== null && !meetsWcagAaUiContrast(presetContrast);
          return (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              onClick={() => onApplyPreset(preset.primaryColor, preset.secondaryColor)}
              className={cn(
                "h-auto flex items-center gap-2.5 rounded-xl border p-2.5 text-start transition-all hover:border-primary/40",
                active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20",
              )}
            >
              <span className="relative h-9 w-9 shrink-0 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.primaryColor }}>
                <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondaryColor }} aria-hidden />
                {active ? <Check className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm" aria-hidden /> : null}
                {lowContrast ? <AlertTriangle className="absolute -start-1 -top-1 h-3 w-3 text-warning drop-shadow-sm dark:text-warning" aria-label={t("theme.presetContrastLow")} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">{t(preset.labelKey)}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{preset.primaryColor}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface BrandSemanticPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  tokens: BrandingTokens;
  onPrimaryBg: string;
  onPrimaryFg: string;
  onSecondaryBg: string;
  onSecondaryFg: string;
}

export function BrandSemanticPreview({
  primaryColor,
  secondaryColor,
  previewMode,
  tokens,
  onPrimaryBg,
  onPrimaryFg,
  onSecondaryBg,
  onSecondaryFg,
}: BrandSemanticPreviewProps) {
  const { t } = useTranslation();
  const chartPalette = resolveBrandingChartPaletteHex(primaryColor, secondaryColor, previewMode);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        <p className="text-xs font-semibold text-foreground">{t("theme.semanticPreviewTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("theme.semanticPreviewDesc")}</p>
        <span className="ms-auto">
          <SettingsMetaBadge variant="muted">{t(previewMode === "dark" ? "global.themeDark" : "global.themeLight")}</SettingsMetaBadge>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="space-y-3 border-b border-border p-4 md:border-b-0 md:border-e">
          <Button type="button" variant="ghost" className="h-auto w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm" style={{ backgroundColor: onPrimaryBg, color: onPrimaryFg }}>
            {t("theme.previewPrimaryAction")}
          </Button>
          <Button type="button" variant="ghost" className="h-auto w-full rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: onSecondaryBg, color: onSecondaryFg, borderColor: onSecondaryBg }}>
            {t("theme.previewAccentAction")}
          </Button>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>{t("theme.previewStatusBadge")}</span>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${secondaryColor}22`, color: secondaryColor }}>{t("theme.previewAccentBadge")}</span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-lg border p-3" style={{ backgroundColor: brandingTokenToCss(tokens["--muted"]!), borderColor: brandingTokenToCss(tokens["--border"]!) }}>
            <p className="text-xs font-medium" style={{ color: brandingTokenToCss(tokens["--foreground"]!) }}>{t("theme.previewCardTitle")}</p>
            <p className="mt-1 text-xs" style={{ color: brandingTokenToCss(tokens["--muted-foreground"]!) }}>{t("theme.previewCardBody")}</p>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: brandingTokenToCss(tokens["--sidebar-background"]!) }}>
            <span className="text-xs font-medium" style={{ color: brandingTokenToCss(tokens["--sidebar-foreground"]!) }}>{t("theme.previewSidebar")}</span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandingTokenToCss(tokens["--sidebar-primary"]!) }} aria-hidden />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("theme.chartPreviewTitle")}</p>
            <div className="flex gap-1">
              {chartPalette.charts.map((hex, index) => (
                <span key={`chart-${index}`} className="h-6 flex-1 rounded-md border border-border" style={{ backgroundColor: hex }} aria-label={t("theme.chartPreviewSwatch", { index: index + 1 })} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BrandDerivedTokensProps {
  tokens: BrandingTokens;
}

export function BrandDerivedTokens({ tokens }: BrandDerivedTokensProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label>{t("theme.derivedTokensTitle")}</Label>
      <p className="text-xs text-muted-foreground">{t("theme.derivedTokensDesc")}</p>
      <div className="flex flex-wrap gap-2">
        {DERIVED_SWATCHES.map((swatch) => (
          <div key={swatch.labelKey} className="flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2 py-1.5">
            <span className="h-5 w-5 shrink-0 rounded-md border border-border" style={{ backgroundColor: brandingTokenToCss(tokens[swatch.token]!) }} aria-hidden />
            <span className="text-xs font-medium text-muted-foreground">{t(swatch.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
