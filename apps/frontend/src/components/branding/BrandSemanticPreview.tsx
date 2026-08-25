import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Eye,
  IdCard,
  LayoutGrid,
  Moon,
  Sparkles,
  Sun,
  Table,
} from "lucide-react";
import {
  brandingTokenToHex,
  buildBrandingCssVariables,
  resolveBrandingChartPaletteHex,
  type BrandingThemeMode,
} from "@mms/shared";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

import type { BrandingTokens } from "./brandColorPanelShared";
import { BrandSemanticPreviewActionsTab } from "./BrandSemanticPreviewActionsTab";
import { BrandSemanticPreviewDashboardTab } from "./BrandSemanticPreviewDashboardTab";
import { BrandSemanticPreviewDocumentTab } from "./BrandSemanticPreviewDocumentTab";
import { BrandSemanticPreviewTableTab } from "./BrandSemanticPreviewTableTab";

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

  const previewContext = useMemo(
    () => ({
      activeOnPrimaryBg: brandingTokenToHex(activeTokens["--primary"] ?? "", primaryColor),
      activeOnPrimaryFg: brandingTokenToHex(activeTokens["--primary-foreground"] ?? "", "#ffffff"),
      activeOnSecondaryBg: brandingTokenToHex(activeTokens["--secondary"] ?? "", secondaryColor),
      activeOnSecondaryFg: brandingTokenToHex(activeTokens["--secondary-foreground"] ?? "", "#ffffff"),
      activeTokens,
      chartPalette: resolveBrandingChartPaletteHex(primaryColor, secondaryColor, localMode),
    }),
    [activeTokens, primaryColor, secondaryColor, localMode],
  );

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
        {activeTab === "actions" && <BrandSemanticPreviewActionsTab {...previewContext} />}
        {activeTab === "table" && <BrandSemanticPreviewTableTab {...previewContext} />}
        {activeTab === "dashboard" && <BrandSemanticPreviewDashboardTab {...previewContext} />}
        {activeTab === "document" && <BrandSemanticPreviewDocumentTab {...previewContext} />}
      </div>
    </div>
  );
}
