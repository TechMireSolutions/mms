import React from "react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { isListSummaryWidgetType } from "@/components/dashboard-widgets/registry";
import { useTranslation } from "@/hooks/useTranslation";
import type { SwitchRecordOption } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderSwitchOptions";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import {
  WidgetBuilderCardRoleOptions,
  WidgetBuilderCardTextOptions,
  WidgetBuilderIconPicker,
  type WidgetBuilderIconTab,
} from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderCardOptions";
import { WidgetBuilderColorOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderColorOptions";
import { WidgetBuilderMetricOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderMetricOptions";
import { WidgetBuilderSwitchOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderSwitchOptions";
import { WidgetBuilderThresholdOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderThresholdOptions";
import { WidgetBuilderTypeSelector } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderTypeSelector";

interface WidgetBuilderOptionsPanelProps {
  mode: "dashboard" | "kpi";
  widgetType: CustomWidget["widgetType"];
  setWidgetType: (widgetType: CustomWidget["widgetType"]) => void;
  titleState: WidgetBuilderTitleState;
  metricState: WidgetBuilderMetricState;
  thresholdState: WidgetBuilderThresholdState;
  switchState: WidgetBuilderSwitchState;
  cardState: WidgetBuilderCardState;
  iconState: WidgetBuilderIconState;
  dbRecordsList: SwitchRecordOption[];
}

interface WidgetBuilderTitleState {
  builderTitle: string;
  setBuilderTitle: (builderTitle: string) => void;
}

interface WidgetBuilderMetricState {
  builderCollection: CustomWidget["collection"];
  setBuilderCollection: (builderCollection: CustomWidget["collection"]) => void;
  builderOperation: CustomWidget["operation"];
  setBuilderOperation: (builderOperation: CustomWidget["operation"]) => void;
  builderTargetField: string;
  setBuilderTargetField: (builderTargetField: string) => void;
  builderFilterField: string;
  setBuilderFilterField: (builderFilterField: string) => void;
  builderFilterOperator: CustomWidget["filterOperator"];
  setBuilderFilterOperator: (builderFilterOperator: CustomWidget["filterOperator"]) => void;
  builderFilterValue: string;
  setBuilderFilterValue: (builderFilterValue: string) => void;
  builderColor: string;
  setBuilderColor: (builderColor: string) => void;
}

interface WidgetBuilderThresholdState {
  thresholdEnabled: boolean;
  setThresholdEnabled: (thresholdEnabled: boolean) => void;
  thresholdCondition: "lt" | "gt" | "equals";
  setThresholdCondition: (thresholdCondition: "lt" | "gt" | "equals") => void;
  thresholdValue: string;
  setThresholdValue: (thresholdValue: string) => void;
  thresholdColor: "red" | "amber" | "yellow";
  setThresholdColor: (thresholdColor: "red" | "amber" | "yellow") => void;
}

interface WidgetBuilderSwitchState {
  switchActionType: "app_setting" | "db_record";
  setSwitchActionType: (switchActionType: "app_setting" | "db_record") => void;
  switchStateKey: string;
  setSwitchStateKey: (switchStateKey: string) => void;
  switchCollection: CustomWidget["collection"];
  setSwitchCollection: (switchCollection: CustomWidget["collection"]) => void;
  switchRecordId: string;
  setSwitchRecordId: (switchRecordId: string) => void;
  switchLabelOn: string;
  setSwitchLabelOn: (switchLabelOn: string) => void;
  switchLabelOff: string;
  setSwitchLabelOff: (switchLabelOff: string) => void;
}

interface WidgetBuilderCardState {
  builderIcon: string;
  setBuilderIcon: (builderIcon: string) => void;
  subTextType: "fixed" | "dynamic";
  setSubTextType: (subTextType: "fixed" | "dynamic") => void;
  fixedSubText: string;
  setFixedSubText: (fixedSubText: string) => void;
  trend: number;
  setTrend: (trend: number) => void;
  trendType: "manual" | "database";
  setTrendType: (trendType: "manual" | "database") => void;
  builderRole: string;
  setBuilderRole: (builderRole: string) => void;
}

interface WidgetBuilderIconState {
  iconSearch: string;
  setIconSearch: (iconSearch: string) => void;
  activeIconTab: WidgetBuilderIconTab;
  setActiveIconTab: (activeIconTab: WidgetBuilderIconTab) => void;
}

export function WidgetBuilderOptionsPanel({
  mode,
  widgetType,
  setWidgetType,
  titleState,
  metricState,
  thresholdState,
  switchState,
  cardState,
  iconState,
  dbRecordsList,
}: WidgetBuilderOptionsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { builderTitle, setBuilderTitle } = titleState;
  const {
    builderCollection,
    setBuilderCollection,
    builderOperation,
    setBuilderOperation,
    builderTargetField,
    setBuilderTargetField,
    builderFilterField,
    setBuilderFilterField,
    builderFilterOperator,
    setBuilderFilterOperator,
    builderFilterValue,
    setBuilderFilterValue,
    builderColor,
    setBuilderColor,
  } = metricState;
  const {
    thresholdEnabled,
    setThresholdEnabled,
    thresholdCondition,
    setThresholdCondition,
    thresholdValue,
    setThresholdValue,
    thresholdColor,
    setThresholdColor,
  } = thresholdState;
  const {
    switchActionType,
    setSwitchActionType,
    switchStateKey,
    setSwitchStateKey,
    switchCollection,
    setSwitchCollection,
    switchRecordId,
    setSwitchRecordId,
    switchLabelOn,
    setSwitchLabelOn,
    switchLabelOff,
    setSwitchLabelOff,
  } = switchState;
  const {
    builderIcon,
    setBuilderIcon,
    subTextType,
    setSubTextType,
    fixedSubText,
    setFixedSubText,
    trend,
    setTrend,
    trendType,
    setTrendType,
    builderRole,
    setBuilderRole,
  } = cardState;
  const { iconSearch, setIconSearch, activeIconTab, setActiveIconTab } = iconState;
  const usesMetricOptions = widgetType !== "switch" && !isListSummaryWidgetType(widgetType);

  return (
    <div className="lg:col-span-2 space-y-4">
      <WidgetBuilderTypeSelector
        builderCollection={builderCollection}
        widgetType={widgetType}
        setWidgetType={setWidgetType}
        setBuilderOperation={setBuilderOperation}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className={FORM_LABEL}>{t("reports.widgets.builder.labelTitle")}</label>
          <Input
            type="text"
            value={builderTitle}
            onChange={(event) => setBuilderTitle(event.target.value)}
            placeholder={t("reports.widgets.builder.placeholderTitle")}
            className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-11"
          />
        </div>

        {widgetType === "card" && mode === "dashboard" && (
          <WidgetBuilderCardRoleOptions
            builderRole={builderRole}
            setBuilderRole={setBuilderRole}
          />
        )}

        {usesMetricOptions ? (
          <WidgetBuilderMetricOptions
            builderCollection={builderCollection}
            setBuilderCollection={setBuilderCollection}
            builderOperation={builderOperation}
            setBuilderOperation={setBuilderOperation}
            builderTargetField={builderTargetField}
            setBuilderTargetField={setBuilderTargetField}
            builderFilterField={builderFilterField}
            setBuilderFilterField={setBuilderFilterField}
            builderFilterOperator={builderFilterOperator}
            setBuilderFilterOperator={setBuilderFilterOperator}
            builderFilterValue={builderFilterValue}
            setBuilderFilterValue={setBuilderFilterValue}
          >
            {widgetType === "card" && (
              <WidgetBuilderCardTextOptions
                subTextType={subTextType}
                setSubTextType={setSubTextType}
                fixedSubText={fixedSubText}
                setFixedSubText={setFixedSubText}
                trend={trend}
                setTrend={setTrend}
                trendType={trendType}
                setTrendType={setTrendType}
              />
            )}
          </WidgetBuilderMetricOptions>
        ) : (
          <WidgetBuilderSwitchOptions
            switchActionType={switchActionType}
            setSwitchActionType={setSwitchActionType}
            switchStateKey={switchStateKey}
            setSwitchStateKey={setSwitchStateKey}
            switchCollection={switchCollection}
            setSwitchCollection={setSwitchCollection}
            switchRecordId={switchRecordId}
            setSwitchRecordId={setSwitchRecordId}
            switchLabelOn={switchLabelOn}
            setSwitchLabelOn={setSwitchLabelOn}
            switchLabelOff={switchLabelOff}
            setSwitchLabelOff={setSwitchLabelOff}
            dbRecordsList={dbRecordsList}
          />
        )}
      </div>

      {usesMetricOptions && (
        <WidgetBuilderThresholdOptions
          thresholdEnabled={thresholdEnabled}
          setThresholdEnabled={setThresholdEnabled}
          thresholdCondition={thresholdCondition}
          setThresholdCondition={setThresholdCondition}
          thresholdValue={thresholdValue}
          setThresholdValue={setThresholdValue}
          thresholdColor={thresholdColor}
          setThresholdColor={setThresholdColor}
        />
      )}

      <WidgetBuilderColorOptions
        builderColor={builderColor}
        setBuilderColor={setBuilderColor}
      />

      {widgetType === "card" && (
        <WidgetBuilderIconPicker
          builderIcon={builderIcon}
          setBuilderIcon={setBuilderIcon}
          iconSearch={iconSearch}
          setIconSearch={setIconSearch}
          activeIconTab={activeIconTab}
          setActiveIconTab={setActiveIconTab}
        />
      )}
    </div>
  );
}
