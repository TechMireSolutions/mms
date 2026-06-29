import React, { useCallback, useMemo } from "react";
import { WidgetBuilder, CustomWidget } from "./PinnedWidgets";
import { CustomCard } from "./reportMetadata";
import { getObject, saveObject } from "../../lib/db";

interface DynamicCardBuilderProps {
  initialCollection?: CustomCard["collection"];
  mode?: "dashboard" | "kpi";
  category?: string;
  editCardConfig?: CustomCard | null;
  onCancelEdit?: () => void;
}

export default function DynamicCardBuilder({
  initialCollection,
  mode = "dashboard",
  category = "students",
  editCardConfig = null,
  onCancelEdit
}: DynamicCardBuilderProps): React.JSX.Element {
  // Convert CustomCard to CustomWidget
  const editWidgetConfig = useMemo<CustomWidget | null>(() => {
    if (!editCardConfig) return null;

    return {
      id: editCardConfig.id,
      title: editCardConfig.title,
      category,
      collection: editCardConfig.collection,
      widgetType: "card",
      operation: editCardConfig.operation,
      targetField: editCardConfig.targetField,
      filterField: editCardConfig.filterField,
      filterOperator: editCardConfig.filterOperator,
      filterValue: editCardConfig.filterValue,
      color: editCardConfig.color,
      isPinnedToDashboard: false,
      icon: editCardConfig.icon,
      subTextType: editCardConfig.subTextType,
      fixedSubText: editCardConfig.fixedSubText,
      trend: editCardConfig.trend,
      trendType: editCardConfig.trendType,
      role: editCardConfig.role
    };
  }, [category, editCardConfig]);

  const handleSaveWidget = useCallback((savedWidget: CustomWidget) => {
    // Convert CustomWidget to CustomCard
    const newCard: CustomCard = {
      id: savedWidget.id,
      role: savedWidget.role,
      title: savedWidget.title,
      collection: savedWidget.collection,
      operation: savedWidget.operation,
      targetField: savedWidget.targetField,
      filterField: savedWidget.filterField,
      filterOperator: savedWidget.filterOperator,
      filterValue: savedWidget.filterValue,
      icon: savedWidget.icon || "GraduationCap",
      color: savedWidget.color,
      subTextType: savedWidget.subTextType || "dynamic",
      fixedSubText: savedWidget.fixedSubText,
      trend: savedWidget.trend,
      trendType: savedWidget.trendType
    };

    if (mode === "kpi") {
      const activeList = getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
      let updated: CustomCard[];
      if (editCardConfig) {
        updated = activeList.map((card) => card.id === editCardConfig.id ? newCard : card);
      } else {
        updated = [...activeList, newCard];
      }
      saveObject(`kpi_custom_cards_${category}`, updated);
    } else {
      // Save directly to the unified kpi_custom_widgets local storage
      const allWidgets = getObject<CustomWidget[]>("kpi_custom_widgets", []);
      let updated: CustomWidget[];
      if (editCardConfig) {
        updated = allWidgets.map((widget: CustomWidget) => widget.id === editCardConfig.id ? savedWidget : widget);
      } else {
        updated = [...allWidgets, savedWidget];
      }
      saveObject("kpi_custom_widgets", updated);
    }

    if (onCancelEdit) {
      onCancelEdit();
    }
    window.dispatchEvent(new Event("local-database-update"));
  }, [category, editCardConfig, mode, onCancelEdit]);

  const handleCancelEdit = useCallback(() => {
    onCancelEdit?.();
  }, [onCancelEdit]);

  return (
    <WidgetBuilder
      initialCollection={initialCollection || "contacts"}
      editWidgetConfig={editWidgetConfig}
      onCancelEdit={handleCancelEdit}
      onSaveWidget={handleSaveWidget}
      category={category}
      mode={mode}
      initialWidgetType="card"
    />
  );
}
