import React from "react";
import { Search } from "lucide-react";
import { capitalize, type AppTranslationKey } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { ICONS_LIST } from "@/tenant/features/reports/components/pinnedWidgets/types";

export type WidgetBuilderIconTab = "all" | "academic" | "finance" | "status" | "general";

interface WidgetBuilderCardRoleOptionsProps {
  builderRole: string;
  setBuilderRole: (role: string) => void;
}

interface WidgetBuilderCardTextOptionsProps {
  subTextType: "fixed" | "dynamic";
  setSubTextType: (subTextType: "fixed" | "dynamic") => void;
  fixedSubText: string;
  setFixedSubText: (fixedSubText: string) => void;
  trend: number;
  setTrend: (trend: number) => void;
  trendType: "manual" | "database";
  setTrendType: (trendType: "manual" | "database") => void;
}

interface WidgetBuilderIconPickerProps {
  builderIcon: string;
  setBuilderIcon: (builderIcon: string) => void;
  iconSearch: string;
  setIconSearch: (iconSearch: string) => void;
  activeIconTab: WidgetBuilderIconTab;
  setActiveIconTab: (activeIconTab: WidgetBuilderIconTab) => void;
}

const ICON_CATEGORIES: Record<Exclude<WidgetBuilderIconTab, "all">, string[]> = {
  academic: ["GraduationCap", "Users", "UserCheck", "Award", "ShieldCheck", "BookOpen"],
  finance: ["DollarSign", "TrendingUp", "Receipt", "Target", "PieChart", "Activity", "Briefcase", "BarChart2"],
  status: ["CalendarCheck", "AlertCircle", "Clock", "CheckCircle2", "Zap"],
  general: ["Star", "Heart"],
};

export function WidgetBuilderCardRoleOptions({
  builderRole,
  setBuilderRole,
}: WidgetBuilderCardRoleOptionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.dashboardRole")}</label>
      <FormSelect
        value={builderRole}
        onChange={setBuilderRole}
        options={[
          { value: "admin", label: t("reports.widgets.builder.roleAdmin") },
          { value: "teacher", label: t("reports.widgets.builder.roleTeacher") },
          { value: "accountant", label: t("reports.widgets.builder.roleAccountant") },
        ]}
      />
    </div>
  );
}

export function WidgetBuilderCardTextOptions({
  subTextType,
  setSubTextType,
  fixedSubText,
  setFixedSubText,
  trend,
  setTrend,
  trendType,
  setTrendType,
}: WidgetBuilderCardTextOptionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-1">
        <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.subtextStyle")}</label>
        <FormSelect
          value={subTextType}
          onChange={(val) => setSubTextType(val as "fixed" | "dynamic")}
          options={[
            { value: "dynamic", label: t("reports.widgets.builder.subtextDynamic") },
            { value: "fixed", label: t("reports.widgets.builder.subtextFixed") },
          ]}
        />
      </div>

      {subTextType === "fixed" && (
        <div className="space-y-1">
          <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.fixedSubtitle")}</label>
          <Input
            type="text"
            value={fixedSubText}
            onChange={(event) => setFixedSubText(event.target.value)}
            placeholder={t("reports.widgets.builder.placeholderSubtitle")}
            className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-11"
          />
        </div>
      )}

      <div className="space-y-1 col-span-1 sm:col-span-2 border-t border-border/40 pt-3">
        <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.trendSource")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-card/20 border border-border/60 p-1 rounded-xl max-w-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTrendType("database")}
            className={`min-h-11 text-xs font-bold uppercase tracking-wider rounded-lg shadow-none ${
              trendType === "database"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("reports.widgets.builder.sourceDb")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTrendType("manual")}
            className={`min-h-11 text-xs font-bold uppercase tracking-wider rounded-lg shadow-none ${
              trendType === "manual"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("reports.widgets.builder.sourceManual")}
          </Button>
        </div>
      </div>

      <div className="space-y-1 col-span-1 sm:col-span-2">
        {trendType === "database" ? (
          <p className="text-xs text-muted-foreground italic leading-normal bg-primary/5 p-3 rounded-xl border border-primary/10">
            ⚡ {t("reports.widgets.builder.dynamicModeDesc")}
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center select-none">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.widgets.builder.manualTrend")}</label>
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                trend > 0 ? "bg-success/20 text-success" : trend < 0 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-100"
                max="100"
                value={trend}
                onChange={(event) => setTrend(Number(event.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrend(0)}
                className="min-h-11 px-2 text-xs font-bold uppercase tracking-wider bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-none"
                title={t("reports.widgets.builder.resetTrend")}
              >
                {t("reports.widgets.builder.reset")}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function WidgetBuilderIconPicker({
  builderIcon,
  setBuilderIcon,
  iconSearch,
  setIconSearch,
  activeIconTab,
  setActiveIconTab,
}: WidgetBuilderIconPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const filteredIcons = Object.keys(ICONS_LIST).filter((name) => {
    const matchesSearch = name.toLowerCase().includes(iconSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (activeIconTab === "all") return true;
    return ICON_CATEGORIES[activeIconTab].includes(name);
  });

  return (
    <div className="space-y-2 pt-3 border-t border-border/45 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {t("reports.widgets.builder.iconSelector")}
        </label>
        <div className="relative max-w-xs w-full">
          <Search className="absolute start-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" style={{ width: 14, height: 14 }} />
          <Input
            type="text"
            placeholder={t("reports.widgets.builder.searchIcons")}
            value={iconSearch}
            onChange={(event) => setIconSearch(event.target.value)}
            className="w-full ps-8 pe-3 py-1.5 text-xs rounded-lg border border-border bg-card/20 backdrop-blur-md text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-semibold animate-fade-in min-h-11"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2 select-none">
        {(["all", "academic", "finance", "status", "general"] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            variant="outline"
            onClick={() => setActiveIconTab(tab)}
            className={`px-2 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-none ${
              activeIconTab === tab
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            {t(`reports.widgets.builder.cat${capitalize(tab)}` as AppTranslationKey) || tab}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5 bg-card/20 border border-border/50 p-2.5 rounded-2xl max-h-[6.875rem] overflow-y-auto pe-1">
        {filteredIcons.length === 0 ? (
          <p className="text-xs text-muted-foreground italic col-span-full py-2 text-center font-sans">{t("reports.widgets.builder.noIconsFound")}</p>
        ) : (
          filteredIcons.map((iconName) => {
            const Icon = ICONS_LIST[iconName];
            const active = builderIcon === iconName;
            if (!Icon) return null;
            return (
              <Button
                key={iconName}
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBuilderIcon(iconName)}
                className={`rounded-xl border flex items-center justify-center hover:scale-105 shadow-none ${
                  active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:text-foreground"
                }`}
                title={iconName}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
