import React from "react";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { WidgetBuilderPreview } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderPreview";
import { WidgetBuilderHeader } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderHeader";
import { WidgetBuilderOptionsPanel } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderOptionsPanel";
import { useWidgetBuilderState } from "@/tenant/features/reports/components/pinnedWidgets/useWidgetBuilderState";

interface WidgetBuilderProps {
  initialCollection: CustomWidget["collection"];
  editWidgetConfig: CustomWidget | null;
  onCancelEdit: () => void;
  onSaveWidget: (widget: CustomWidget) => void;
  category?: string;
  mode?: "dashboard" | "kpi";
  initialWidgetType?: CustomWidget["widgetType"];
}

export function WidgetBuilder({
  initialCollection,
  editWidgetConfig,
  onCancelEdit,
  onSaveWidget,
  category = "students",
  mode = "kpi",
  initialWidgetType = "kpi",
}: WidgetBuilderProps): React.JSX.Element {
  const {
    collections,
    widgetType,
    setWidgetType,
    scalerSize,
    setScalerSize,
    previewWidget,
    handleSaveWidget,
    canSave,
    dbRecordsList,
    titleState,
    metricState,
    thresholdState,
    switchState,
    cardState,
    iconState,
  } = useWidgetBuilderState({
    initialCollection,
    editWidgetConfig,
    category,
    mode,
    initialWidgetType,
    onSaveWidget,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-6 space-y-4 font-sans text-start">
      <WidgetBuilderHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <WidgetBuilderOptionsPanel
          mode={mode}
          widgetType={widgetType}
          setWidgetType={setWidgetType}
          titleState={titleState}
          metricState={metricState}
          thresholdState={thresholdState}
          switchState={switchState}
          cardState={cardState}
          iconState={iconState}
          dbRecordsList={dbRecordsList}
        />

        <WidgetBuilderPreview
          previewWidget={previewWidget}
          collections={collections}
          scalerSize={scalerSize}
          setScalerSize={setScalerSize}
          onCancelEdit={onCancelEdit}
          onSave={handleSaveWidget}
          canSave={canSave}
          isEditing={Boolean(editWidgetConfig)}
          onSwitchToggle={() => {}}
        />
      </div>
    </div>
  );
}
