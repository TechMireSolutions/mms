import React, { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveWidgetTitle, resolveWidgetSubText } from "@/lib/dashboardWidgets";
import {
  COMPOSED_WIDGET_TYPES,
} from "@/components/dashboard-widgets/registry";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { resolveThresholdChartHex, resolveWidgetChartHex } from "@/lib/brandingChartPalette";
import { computeCustomCard, type CustomCard } from "@/tenant/features/reports/components/reportMetadata";
import { getObject } from "@/lib/db";
import {
  type ReportCollectionsSnapshot,
} from "@/lib/reports/useReportCollections";
import {
  CustomWidget,
  ALERT_COLOR_MAP,
} from "@/tenant/features/reports/components/pinnedWidgets/types";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  computeWidgetSingleValue,
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
  computeSessionsCustomCardValue,
  computeEnrollmentsCustomCardValue,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
import { CustomWidgetCompactLayout } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetCompactLayout";
import { CustomWidgetComfortableLayout } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetComfortableLayout";

export { WidgetDrilldownModal } from "@/tenant/features/reports/components/pinnedWidgets/WidgetDrilldownModal";

/**
 * Render interface resolving dynamic card visualizations.
 */
export function CustomWidgetRenderer({
  widget,
  collections,
  isCompact,
  isEditMode = false,
  onSwitchToggle,
  onMetricClick
}: {
  widget: CustomWidget;
  collections: ReportCollectionsSnapshot;
  isCompact?: boolean;
  isEditMode?: boolean;
  onSwitchToggle: (widget: CustomWidget) => void;
  onMetricClick: (widget: CustomWidget) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const palette = useBrandPalette();
  
  const resolvedWidgetType = useMemo(() => {
    const type = widget.widgetType || "";
    if (["bar", "line", "area", "pie", "radar"].includes(type) || ["bar", "line", "area", "pie", "radar"].includes(widget.chartType || "")) {
      return "chart";
    }
    const knownTypes = [
      "kpi", "progress", "switch", "card",
      ...COMPOSED_WIDGET_TYPES,
    ];
    if (knownTypes.includes(type)) {
      return type;
    }
    return "kpi";
  }, [widget.widgetType, widget.chartType]);

  const { value, formattedValue, isAlert } = useMemo(() => {
    if (resolvedWidgetType === "card") {
      return { value: 0, formattedValue: "", isAlert: false };
    }
    return computeWidgetSingleValue(widget, collections);
  }, [resolvedWidgetType, widget, collections]);

  const isSwitchOn = useMemo(() => {
    if (resolvedWidgetType === "card") return false;
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        return !!settings[sectionKey];
      }
      return getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
    }
    const collectionName = widget.switchCollection;
    const recordId = widget.switchRecordId;
    const targetField = widget.switchField || "status";
    if (!collectionName || !recordId) return false;
    const collectionRecords = (collections[collectionName] || []) as unknown[];
    const matchedRecord = collectionRecords.find((candidate) => {
      const record = candidate as Record<string, unknown>;
      return record && String(record.id) === String(recordId);
    });
    if (!matchedRecord) return false;
    const fieldValue = (matchedRecord as Record<string, unknown>)[targetField];
    return String(fieldValue) === "active" || String(fieldValue) === "paid" || !!fieldValue;
  }, [resolvedWidgetType, widget, collections]);

  const computedCard = useMemo(() => {
    if (resolvedWidgetType !== "card") return null;

    const card = widget as unknown as CustomCard;
    const serverComputed = computeServerBackedCard(card, t);

    return serverComputed ?? computeCustomCard(card, {
      ...collections,
      students: [],
      teachers: [],
      contacts: [],
    });
  }, [collections, resolvedWidgetType, t, widget]);

  const colorHex = isAlert
    ? resolveThresholdChartHex(widget.thresholdColor, palette)
    : resolveWidgetChartHex(widget.color, palette);

  const alertScheme = isAlert ? ALERT_COLOR_MAP[widget.thresholdColor || "red"] : null;

  const switchLabel = isSwitchOn
    ? (widget.switchLabelOnKey ? t(widget.switchLabelOnKey) : (widget.switchLabelOn || t("reports.widgets.statusOn")))
    : (widget.switchLabelOffKey ? t(widget.switchLabelOffKey) : (widget.switchLabelOff || t("reports.widgets.statusOff")));

  if (isCompact && resolvedWidgetType !== "chart") {
    return (
      <CustomWidgetCompactLayout
        widget={widget}
        resolvedWidgetType={resolvedWidgetType}
        computedCard={computedCard}
        formattedValue={formattedValue}
        value={value}
        colorHex={colorHex}
        alertScheme={alertScheme}
        isSwitchOn={isSwitchOn}
        switchLabel={switchLabel}
        onSwitchToggle={onSwitchToggle}
        onMetricClick={onMetricClick}
        t={t}
      />
    );
  }

  return (
    <CustomWidgetComfortableLayout
      widget={widget}
      collections={collections}
      resolvedWidgetType={resolvedWidgetType}
      computedCard={computedCard}
      formattedValue={formattedValue}
      value={value}
      colorHex={colorHex}
      alertScheme={alertScheme}
      isAlert={isAlert}
      isSwitchOn={isSwitchOn}
      switchLabel={switchLabel}
      isEditMode={isEditMode}
      onSwitchToggle={onSwitchToggle}
      onMetricClick={onMetricClick}
      t={t}
    />
  );
}

type ServerCardAggregate = ReturnType<typeof computeContactsCustomCardValue>;
type ComputedCustomCard = ReturnType<typeof computeCustomCard>;

function computeServerBackedCard(card: CustomCard, t: TranslationFunction): ComputedCustomCard | null {
  const aggregateValue = getServerCardAggregate(card);
  if (!aggregateValue) return null;

  return {
    id: card.id,
    title: resolveWidgetTitle(card, t),
    value: String(aggregateValue.finalValue),
    sub: resolveWidgetSubText(card, t) || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
    icon: card.icon,
    color: card.color,
    trend: card.trend || 0,
  };
}

function getServerCardAggregate(card: CustomCard): ServerCardAggregate {
  const aggregateInput = {
    id: card.id,
    operation: card.operation,
    targetField: card.targetField,
    filterField: card.filterField,
    filterOperator: card.filterOperator,
    filterValue: card.filterValue,
  };

  if (card.collection === "contacts") return computeContactsCustomCardValue(aggregateInput);
  if (card.collection === "students") return computeStudentsCustomCardValue(aggregateInput);
  if (card.collection === "teachers") return computeTeachersCustomCardValue(aggregateInput);
  if (card.collection === "sessions") return computeSessionsCustomCardValue(aggregateInput);
  if (card.collection === "enrollments") return computeEnrollmentsCustomCardValue(aggregateInput);
  return null;
}


