import React from "react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { FORM_LABEL, FORM_INPUT_BUILDER } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";

export { WidgetBuilderIconPicker, type WidgetBuilderIconTab } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderIconPicker";

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
            className={FORM_INPUT_BUILDER}
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
