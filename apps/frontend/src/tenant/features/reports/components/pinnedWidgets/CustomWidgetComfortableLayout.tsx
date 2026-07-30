import React from "react";
import { ArrowRight, ArrowUpRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { capitalize, type AppTranslationKey } from "@mms/shared";
import { resolveWidgetTitle } from "@/lib/dashboardWidgets";
import { ComposedDashboardWidget, isComposedWidgetType } from "@/components/dashboard-widgets/registry";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { METADATA_FIELDS, getCollectionLabel } from "@/tenant/features/reports/components/reportMetadata";
import { ProgressRing } from "@/tenant/features/reports/components/pinnedWidgets/WidgetProgressRing";
import { COLOR_MAP, ICONS_LIST, type CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import type { computeCustomCard } from "@/tenant/features/reports/components/reportMetadata";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

const CustomWidgetChartFallback = React.lazy(() => import("@/tenant/features/reports/components/pinnedWidgets/CustomWidgetChartFallback"));

type AlertScheme = {
  bg: string;
  text: string;
  border: string;
  glow: string;
} | null;

type ComputedCustomCard = ReturnType<typeof computeCustomCard>;

type CustomWidgetComfortableLayoutProps = {
  widget: CustomWidget;
  collections: ReportCollectionsSnapshot;
  resolvedWidgetType: string;
  computedCard: ComputedCustomCard | null;
  formattedValue: string;
  value: number;
  colorHex: string;
  alertScheme: AlertScheme;
  isAlert: boolean;
  isSwitchOn: boolean;
  switchLabel: string;
  isEditMode: boolean;
  onSwitchToggle: (widget: CustomWidget) => void;
  onMetricClick: (widget: CustomWidget) => void;
  t: TranslationFunction;
};

export function CustomWidgetComfortableLayout({
  widget,
  collections,
  resolvedWidgetType,
  computedCard,
  formattedValue,
  value,
  colorHex,
  alertScheme,
  isAlert,
  isSwitchOn,
  switchLabel,
  isEditMode,
  onSwitchToggle,
  onMetricClick,
  t,
}: CustomWidgetComfortableLayoutProps): React.JSX.Element {
  if (resolvedWidgetType === "card") {
    if (!computedCard) return <></>;

    const Icon = ICONS_LIST[computedCard.icon || ""] || Users;
    const colorClasses = COLOR_MAP[computedCard.color || ""] || COLOR_MAP.emerald;
    const isPositive = computedCard.trend >= 0;

    return (
      <motion.div
        layout
        whileHover={{ y: -4, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="rounded-2xl surface-glass p-5 hover:shadow-surface-lg transition-all relative text-start flex flex-col justify-between min-h-[8.75rem] font-sans overflow-hidden group"
      >
        <div className={`absolute start-0 top-0 bottom-0 w-[3.5px] rounded-e-[2px] ${colorClasses.bar}/60 group-hover:${colorClasses.bar} transition-colors duration-300`} />
        <div className={`absolute -end-8 -top-8 w-20 h-20 rounded-full ${colorClasses.glow} transition-all duration-500`} />
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} ring-4 ${colorClasses.ring} flex items-center justify-center aspect-square flex-shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${colorClasses.text}`} style={{ width: 18, height: 18 }} />
          </div>
          {computedCard.trend !== 0 && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              isPositive ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {isPositive ? "+" : ""}{computedCard.trend}%
            </span>
          )}
        </div>
        <div className="space-y-0.5 flex-1 min-w-0 mt-3">
          <p className="text-xl font-black text-foreground tracking-tight leading-none truncate">
            {computedCard.value}
          </p>
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mt-1 truncate">
            {computedCard.title}
          </h4>
        </div>
        <footer className="text-xs text-muted-foreground mt-3 border-t border-border/30 pt-2 truncate">
          {computedCard.sub}
        </footer>
      </motion.div>
    );
  }

  if (isComposedWidgetType(resolvedWidgetType)) {
    return (
      <ComposedDashboardWidget
        type={resolvedWidgetType}
        title={resolveWidgetTitle(widget, t)}
        isEditMode={isEditMode}
      />
    );
  }

  const colorTheme = COLOR_MAP[widget.color || ""] || COLOR_MAP.emerald;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`rounded-2xl p-5 flex flex-col justify-between shadow-sm relative group hover:shadow-surface-lg transition-all overflow-hidden ${
        alertScheme
          ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} border-[1.5px]`
          : "surface-glass"
      }`}
    >
      <div className={`absolute start-0 top-0 bottom-0 w-[3.5px] rounded-e-[2px] transition-colors duration-300 ${
        isAlert
          ? "bg-destructive/60 group-hover:bg-destructive"
          : `${colorTheme.bar}/60`
      }`} />
      <div className={`absolute -end-8 -top-8 w-24 h-24 rounded-full ${colorTheme.glow} transition-all duration-500`} />
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 space-y-0.5 text-start">
          <span className="block truncate text-xs font-black text-foreground uppercase tracking-widest leading-none">
            {resolveWidgetTitle(widget, t)}
          </span>
          <p className="truncate text-xs text-muted-foreground font-bold uppercase tracking-wider">
            {getWidgetSubtitle(widget, resolvedWidgetType, t)}
          </p>
        </div>

        {isAlert && (
          <StatusBadge
            status="alert"
            size="sm"
            config={{ alert: { label: t("reports.widgets.alertLevel"), cls: `${SEMANTIC_BADGE.destructive} animate-pulse` } }}
          />
        )}
      </div>

      <div className="py-4 flex items-center justify-between min-h-[4.375rem]">
        {resolvedWidgetType === "kpi" && (
          <Button
            onClick={() => onMetricClick(widget)}
            className="h-auto text-start select-none outline-none group/kpi shadow-none px-0 py-0 hover:bg-transparent"
            type="button"
            variant="ghost"
          >
            <span className="block">
              <h4 className={`text-3xl font-black tracking-tight font-mono flex items-baseline gap-1.5 ${alertScheme ? alertScheme.text : "text-foreground"}`}>
                {formattedValue}
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/35 transition-all group-hover/kpi:translate-x-0.5 group-hover/kpi:-translate-y-0.5 group-hover/kpi:text-primary rtl:-scale-x-100 rtl:group-hover/kpi:-translate-x-0.5" />
              </h4>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                {t("reports.widgets.clickToViewRecords")}
              </p>
            </span>
          </Button>
        )}

        {resolvedWidgetType === "progress" && (
          <div className="flex items-center gap-4 w-full">
            <Button
              onClick={() => onMetricClick(widget)}
              className="flex-1 h-auto text-start outline-none group/prog shadow-none px-0 py-0 hover:bg-transparent justify-start"
              type="button"
              variant="ghost"
            >
              <span className="block">
                <h4 className="text-sm font-black text-foreground flex items-center gap-1">
                  {t("reports.widgets.progression")}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover/prog:translate-x-0.5 rtl:rotate-180 rtl:group-hover/prog:-translate-x-0.5" />
                </h4>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  {t("reports.widgets.progressionDesc")}
                </p>
              </span>
            </Button>
            <ProgressRing percentage={value} colorHex={colorHex} />
          </div>
        )}

        {resolvedWidgetType === "switch" && (
          <div className="flex items-center justify-between w-full">
            <div className="text-start">
              <span className={`text-base font-black uppercase tracking-wider ${isSwitchOn ? "text-primary" : "text-muted-foreground"}`}>
                {switchLabel}
              </span>
              <p className="text-xs text-muted-foreground font-semibold mt-1">
                {t("reports.widgets.clickToToggle")}
              </p>
            </div>

            <Switch
              checked={isSwitchOn}
              onCheckedChange={() => onSwitchToggle(widget)}
              className="h-6 w-11"
              aria-label={switchLabel}
            />
          </div>
        )}

        {resolvedWidgetType === "chart" && (
          <div className="w-full h-[5rem] -mb-2">
            <React.Suspense fallback={<div className="w-full h-full bg-muted/20 animate-pulse rounded-xl" />}>
              <CustomWidgetChartFallback widget={widget} collections={collections} />
            </React.Suspense>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getWidgetSubtitle(widget: CustomWidget, resolvedWidgetType: string, t: TranslationFunction): string {
  const widgetTitle = resolveWidgetTitle(widget, t);
  const collectionLabel = getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t);
  const showCollection = !widgetTitle.toLowerCase().includes(collectionLabel.toLowerCase());
  const formulaPart = resolvedWidgetType !== "switch"
    ? t(`reports.widgets.builder.formula${capitalize(widget.operation)}` as AppTranslationKey) || widget.operation
    : "";

  return showCollection
    ? `${collectionLabel}${formulaPart ? ` • ${formulaPart}` : ""}`
    : formulaPart;
}
