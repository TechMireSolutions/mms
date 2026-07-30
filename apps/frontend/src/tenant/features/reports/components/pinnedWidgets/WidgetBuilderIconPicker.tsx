import React from "react";
import { Search } from "lucide-react";
import { capitalize, type AppTranslationKey } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { ICONS_LIST } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { WIDGET_BUILDER_ICON_CATEGORIES, type WidgetBuilderIconTab } from "@/tenant/features/reports/components/pinnedWidgets/widgetBuilderIconCategories";

interface WidgetBuilderIconPickerProps {
  builderIcon: string;
  setBuilderIcon: (builderIcon: string) => void;
  iconSearch: string;
  setIconSearch: (iconSearch: string) => void;
  activeIconTab: WidgetBuilderIconTab;
  setActiveIconTab: (activeIconTab: WidgetBuilderIconTab) => void;
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
    return WIDGET_BUILDER_ICON_CATEGORIES[activeIconTab].includes(name);
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

export type { WidgetBuilderIconTab };
