import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckSquare,
  Eye,
  IdCard,
  LayoutGrid,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Table,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

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

const CUSTOM_PRESETS_STORAGE_KEY = "mms_custom_theme_presets";

export interface CustomThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

function loadCustomPresets(): CustomThemePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomThemePreset[]) : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: CustomThemePreset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

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
  const [customPresets, setCustomPresets] = useState<CustomThemePreset[]>(loadCustomPresets);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState("");

  const handleOpenSaveDialog = (): void => {
    setPresetNameDraft(`${t("theme.customPresetDefaultName")} ${customPresets.length + 1}`);
    setIsSavingPreset(true);
  };

  const handleConfirmSavePreset = (): void => {
    if (!presetNameDraft.trim()) return;

    const newPreset: CustomThemePreset = {
      id: `custom-${Date.now()}`,
      name: presetNameDraft.trim(),
      primaryColor,
      secondaryColor,
    };
    const updated = [...customPresets.slice(-3), newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setIsSavingPreset(false);
    notify.success(t("theme.customPresetSaved"));
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    notify.success(t("theme.customPresetDeleted"));
  };

  return (
    <div className="space-y-3">
      {/* Save Custom Preset Modal */}
      <Modal
        open={isSavingPreset}
        onClose={() => setIsSavingPreset(false)}
        title={t("theme.saveCustomPresetTitle")}
        subtitle={t("theme.saveCustomPresetDesc")}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSavingPreset(false)}
              className="min-h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={!presetNameDraft.trim()}
              onClick={handleConfirmSavePreset}
              className="min-h-10 px-4 text-xs font-semibold"
            >
              {t("common.save")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/30">
            <div className="flex items-center -space-x-2">
              <span
                className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
                aria-label={primaryColor}
              />
              <span
                className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                style={{ backgroundColor: secondaryColor }}
                aria-label={secondaryColor}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {primaryColor} & {secondaryColor}
              </p>
              <p className="text-2xs text-muted-foreground font-mono truncate">
                {t("theme.activeConfig")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-name-input">{t("theme.presetNameLabel")}</Label>
            <Input
              id="preset-name-input"
              value={presetNameDraft}
              onChange={(e) => setPresetNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmSavePreset();
                }
              }}
              placeholder={t("theme.presetNamePlaceholder")}
              autoFocus
              className="min-h-11 h-11 text-xs"
            />
          </div>
        </div>
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>{t("theme.palettesTitle")}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("theme.palettesDesc")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenSaveDialog}
          className="min-h-11 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 me-1" />
          {t("theme.saveCustomPreset")}
        </Button>
      </div>

      {customPresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">{t("theme.customPresetsTitle")}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {customPresets.map((preset) => {
              const active = primaryColor === preset.primaryColor && secondaryColor === preset.secondaryColor;
              return (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.primaryColor, preset.secondaryColor)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onApplyPreset(preset.primaryColor, preset.secondaryColor);
                    }
                  }}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-between gap-2 rounded-xl border p-2.5 text-start transition-all cursor-pointer hover:border-primary/40",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative h-8 w-8 shrink-0 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.primaryColor }}>
                      <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondaryColor }} aria-hidden />
                      {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm" aria-hidden />}
                    </span>
                    <span className="min-w-0 truncate">
                      <span className="block truncate text-xs font-semibold text-foreground">{preset.name}</span>
                      <span className="block truncate font-mono text-2xs text-muted-foreground">{preset.primaryColor}</span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t("theme.deleteCustomPreset")}
                    onClick={(e) => handleDeleteCustom(preset.id, e)}
                    className="min-h-11 min-w-11 p-0 text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                "h-auto min-h-11 flex items-center justify-start gap-2.5 rounded-xl border p-2.5 text-start transition-all hover:border-primary/40",
                active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/30",
              )}
            >
              <span className="relative h-9 w-9 shrink-0 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.primaryColor }}>
                <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondaryColor }} aria-hidden />
                {active ? <Check className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm" aria-hidden /> : null}
                {lowContrast ? <AlertTriangle className="absolute -start-1 -top-1 h-3.5 w-3.5 text-warning drop-shadow-sm dark:text-warning" aria-label={t("theme.presetContrastLow")} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">{t(preset.labelKey)}</span>
                <span className="block truncate font-mono text-2xs text-muted-foreground">{preset.primaryColor}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

type PreviewTab = "actions" | "table" | "document" | "dashboard";
type ColorblindFilterType = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

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
}: BrandSemanticPreviewProps) {
  const { t } = useTranslation();
  const [localMode, setLocalMode] = useState<BrandingThemeMode>(previewMode);
  const [activeTab, setActiveTab] = useState<PreviewTab>("actions");
  const [visionFilter, setVisionFilter] = useState<ColorblindFilterType>("normal");

  useEffect(() => {
    setLocalMode(previewMode);
  }, [previewMode]);

  const activeTokens = useMemo(
    () => buildBrandingCssVariables(primaryColor, secondaryColor, localMode),
    [primaryColor, secondaryColor, localMode],
  );

  const activeOnPrimaryBg = brandingTokenToHex(activeTokens["--primary"] ?? "", primaryColor);
  const activeOnPrimaryFg = brandingTokenToHex(activeTokens["--primary-foreground"] ?? "", "#ffffff");
  const activeOnSecondaryBg = brandingTokenToHex(activeTokens["--secondary"] ?? "", secondaryColor);
  const activeOnSecondaryFg = brandingTokenToHex(activeTokens["--secondary-foreground"] ?? "", "#ffffff");
  const chartPalette = resolveBrandingChartPaletteHex(primaryColor, secondaryColor, localMode);

  const filterStyle =
    visionFilter !== "normal" ? { filter: `url(#mms-cb-${visionFilter})` } : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Hidden SVG Color Matrix Filters for Vision Simulation */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="mms-cb-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="mms-cb-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="mms-cb-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="mms-cb-achromatopsia">
            <feColorMatrix
              type="matrix"
              values="0.299, 0.587, 0.114, 0, 0  0.299, 0.587, 0.114, 0, 0  0.299, 0.587, 0.114, 0, 0  0, 0, 0, 1, 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Preview Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          <p className="text-xs font-semibold text-foreground">{t("theme.semanticPreviewTitle")}</p>
        </div>

        {/* Tab & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Surface View Switcher */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5" role="tablist">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={activeTab === "actions"}
              onClick={() => setActiveTab("actions")}
              className={cn(
                "min-h-11 px-3 text-xs font-medium rounded-md transition-all",
                activeTab === "actions" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 me-1.5" />
              {t("theme.previewTabActions")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={activeTab === "table"}
              onClick={() => setActiveTab("table")}
              className={cn(
                "min-h-11 px-3 text-xs font-medium rounded-md transition-all",
                activeTab === "table" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table className="h-3.5 w-3.5 me-1.5" />
              {t("theme.previewTabTable")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "min-h-11 px-3 text-xs font-medium rounded-md transition-all",
                activeTab === "dashboard" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 me-1.5" />
              {t("theme.previewTabDashboard")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={activeTab === "document"}
              onClick={() => setActiveTab("document")}
              className={cn(
                "min-h-11 px-3 text-xs font-medium rounded-md transition-all",
                activeTab === "document" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IdCard className="h-3.5 w-3.5 me-1.5" />
              {t("theme.previewTabDocument")}
            </Button>
          </div>

          {/* Colorblindness Simulator Selector with Radix Select primitive */}
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            <Select
              value={visionFilter}
              onValueChange={(val) => setVisionFilter(val as ColorblindFilterType)}
            >
              <SelectTrigger
                aria-label={t("theme.colorblindFilter")}
                className="h-11 min-h-11 min-w-36 text-xs font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" className="text-xs">{t("theme.colorblindNormal")}</SelectItem>
                <SelectItem value="protanopia" className="text-xs">{t("theme.colorblindProtanopia")}</SelectItem>
                <SelectItem value="deuteranopia" className="text-xs">{t("theme.colorblindDeuteranopia")}</SelectItem>
                <SelectItem value="tritanopia" className="text-xs">{t("theme.colorblindTritanopia")}</SelectItem>
                <SelectItem value="achromatopsia" className="text-xs">{t("theme.colorblindAchromatopsia")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5" role="group" aria-label={t("theme.previewModeToggle")}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocalMode("light")}
              aria-pressed={localMode === "light"}
              className={cn(
                "min-h-11 px-3 text-xs font-semibold rounded-md transition-all",
                localMode === "light" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sun className="h-3.5 w-3.5 me-1" aria-hidden />
              {t("theme.previewModeLight")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocalMode("dark")}
              aria-pressed={localMode === "dark"}
              className={cn(
                "min-h-11 px-3 text-xs font-semibold rounded-md transition-all",
                localMode === "dark" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Moon className="h-3.5 w-3.5 me-1" aria-hidden />
              {t("theme.previewModeDark")}
            </Button>
          </div>
        </div>
      </div>

      {/* Surface Preview Sandbox Container */}
      <div style={filterStyle} className="transition-all duration-200">
        {activeTab === "actions" && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="space-y-3.5 border-b border-border bg-card/40 p-4 md:border-b-0 md:border-e">
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform interactive-scale hover:shadow-xl"
                style={{ backgroundColor: activeOnPrimaryBg, color: activeOnPrimaryFg }}
              >
                {t("theme.previewPrimaryAction")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-transform interactive-scale hover:shadow-xl"
                style={{ backgroundColor: activeOnSecondaryBg, color: activeOnSecondaryFg, borderColor: activeOnSecondaryBg }}
              >
                {t("theme.previewAccentAction")}
              </Button>
              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className="inline-flex items-center gap-1.5 font-bold rounded-md border px-2.5 py-1 text-xs shadow-2xs transition-all"
                  style={{
                    backgroundColor: `${activeOnPrimaryBg}18`,
                    color: activeOnPrimaryBg,
                    borderColor: `${activeOnPrimaryBg}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: activeOnPrimaryBg }}
                    aria-hidden="true"
                  />
                  {t("theme.previewStatusBadge")}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 font-bold rounded-md border px-2.5 py-1 text-xs shadow-2xs transition-all"
                  style={{
                    backgroundColor: `${activeOnSecondaryBg}18`,
                    color: activeOnSecondaryBg,
                    borderColor: `${activeOnSecondaryBg}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: activeOnSecondaryBg }}
                    aria-hidden="true"
                  />
                  {t("theme.previewAccentBadge")}
                </span>
              </div>
            </div>
            <div className="space-y-3.5 bg-muted/10 p-4">
              <div className="rounded-xl border p-3.5 shadow-2xs" style={{ backgroundColor: brandingTokenToCss(activeTokens["--muted"]!), borderColor: brandingTokenToCss(activeTokens["--border"]!) }}>
                <p className="text-xs font-semibold" style={{ color: brandingTokenToCss(activeTokens["--foreground"]!) }}>
                  {t("theme.previewCardTitle")}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: brandingTokenToCss(activeTokens["--muted-foreground"]!) }}>
                  {t("theme.previewCardBody")}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5 shadow-2xs" style={{ backgroundColor: brandingTokenToCss(activeTokens["--sidebar-background"]!) }}>
                <span className="text-xs font-semibold" style={{ color: brandingTokenToCss(activeTokens["--sidebar-foreground"]!) }}>
                  {t("theme.previewSidebar")}
                </span>
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-background" style={{ backgroundColor: brandingTokenToCss(activeTokens["--sidebar-primary"]!) }} aria-hidden />
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">{t("theme.chartPreviewTitle")}</p>
                <div className="flex gap-1.5">
                  {chartPalette.charts.map((hex, index) => (
                    <span key={`chart-${index}`} className="h-6 flex-1 rounded-md border border-border/80 shadow-2xs transition-transform hover:scale-105" style={{ backgroundColor: hex }} aria-label={t("theme.chartPreviewSwatch", { index: index + 1 })} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "table" && (
          <div className="space-y-3.5 bg-muted/10 p-4">
            {/* Search Input Mockup */}
            <div className="relative max-w-sm">
              <Search className="absolute start-3 top-3.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <input
                type="text"
                readOnly
                placeholder={t("theme.previewSearchPlaceholder")}
                className="h-11 min-h-11 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-xs shadow-xs focus:outline-none"
                style={{ borderColor: activeOnPrimaryBg }}
              />
            </div>

            {/* Data Table Row Mockup */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" style={{ color: activeOnPrimaryBg }} aria-hidden />
                  <span>Student & Course</span>
                </span>
                <span>Status</span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs text-white shadow-xs"
                    style={{ backgroundColor: activeOnPrimaryBg }}
                  >
                    SA
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t("theme.previewTableRowTitle")}</p>
                    <p className="text-2xs text-muted-foreground">{t("theme.previewTableRowSubtitle")}</p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center font-bold rounded-md border px-2.5 py-0.5 text-2xs shadow-2xs transition-all"
                  style={{
                    backgroundColor: `${activeOnPrimaryBg}18`,
                    color: activeOnPrimaryBg,
                    borderColor: `${activeOnPrimaryBg}35`,
                  }}
                >
                  {t("theme.previewTableRowBadge")}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="p-4 space-y-4 bg-muted/10">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{t("theme.previewMetricTitle")}</p>
                  <p className="text-xl font-extrabold text-foreground tracking-tight">842</p>
                  <div className="flex items-center gap-1 text-2xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>{t("theme.previewMetricTrend")}</span>
                  </div>
                </div>
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: activeOnPrimaryBg }}
                >
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t("theme.previewChartSeriesA")}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: activeOnPrimaryBg }}>94.2%</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: "94.2%", backgroundColor: activeOnPrimaryBg }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-foreground">{t("theme.previewChartSeriesB")}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: activeOnSecondaryBg }}>88.6%</span>
                </div>
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: "88.6%", backgroundColor: activeOnSecondaryBg }} />
                </div>
              </div>
            </div>

            {/* Multi-series chart distribution mockup */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">{t("theme.previewChartTitle")}</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-3xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeOnPrimaryBg }} />
                    {t("theme.previewPrimaryAction")}
                  </span>
                  <span className="flex items-center gap-1 text-3xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeOnSecondaryBg }} />
                    {t("theme.previewAccentAction")}
                  </span>
                </div>
              </div>

              {/* Chart Bar Mockup */}
              <div className="h-24 flex items-end justify-between gap-2 pt-2 px-2 border-b border-border/60">
                {[
                  { label: "Mon", h1: "65%", h2: "45%" },
                  { label: "Tue", h1: "80%", h2: "60%" },
                  { label: "Wed", h1: "92%", h2: "75%" },
                  { label: "Thu", h1: "85%", h2: "70%" },
                  { label: "Fri", h1: "95%", h2: "85%" },
                  { label: "Sat", h1: "70%", h2: "50%" },
                ].map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full max-w-[20px] flex items-end gap-0.5 h-full">
                      <div
                        className="flex-1 rounded-t-sm transition-all duration-300"
                        style={{ height: item.h1, backgroundColor: activeOnPrimaryBg }}
                      />
                      <div
                        className="flex-1 rounded-t-sm transition-all duration-300 opacity-80"
                        style={{ height: item.h2, backgroundColor: activeOnSecondaryBg }}
                      />
                    </div>
                    <span className="text-3xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "document" && (
          <div className="flex justify-center p-6 bg-muted/15">
            {/* Student ID Badge Mockup */}
            <div
              className="w-full max-w-xs overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg transition-shadow hover:shadow-xl"
            >
              <div
                className="px-5 py-3.5 text-center text-white"
                style={{ backgroundColor: activeOnPrimaryBg }}
              >
                <p className="text-3xs uppercase tracking-widest font-extrabold opacity-90">{t("theme.previewStudentCardTitle")}</p>
                <p className="text-sm font-bold mt-0.5 tracking-tight">Madrasa Noor-ul-Quran</p>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 shadow-inner"
                  style={{ borderColor: activeOnSecondaryBg }}
                >
                  <User className="h-8 w-8 text-muted-foreground/80" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">Zayd Al-Mansoor</p>
                  <p className="text-xs text-muted-foreground">{t("theme.previewStudentCardRole")}</p>
                  <p className="font-mono text-2xs text-muted-foreground">{t("theme.previewStudentCardId")}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider shadow-2xs"
                    style={{
                      backgroundColor: `${activeOnSecondaryBg}18`,
                      color: activeOnSecondaryBg,
                    }}
                  >
                    Active 2026/27
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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
        {DERIVED_SWATCHES.map((swatch) => {
          const rawVal = tokens[swatch.token];
          const hex = rawVal ? brandingTokenToHex(rawVal) : "";
          return (
            <div
              key={swatch.labelKey}
              title={`${t(swatch.labelKey)}: ${hex || rawVal}`}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/60 px-2.5 py-1.5 shadow-2xs transition-all hover:border-primary/40 hover:bg-card"
            >
              <span
                className="h-5 w-5 shrink-0 rounded-md border border-white/20 shadow-2xs"
                style={{ backgroundColor: rawVal ? brandingTokenToCss(rawVal) : undefined }}
                aria-hidden
              />
              <span className="text-xs font-medium text-foreground">{t(swatch.labelKey)}</span>
              {hex && (
                <span className="font-mono text-3xs text-muted-foreground font-semibold ps-0.5">
                  {hex}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

