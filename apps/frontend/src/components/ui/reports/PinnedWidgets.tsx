import React from "react";
import { PinnedWidgetsBuilderSection } from "./PinnedWidgetsBuilderSection";
import { PinnedWidgetsChrome } from "./PinnedWidgetsChrome";
import { PinnedWidgetsGrid } from "./PinnedWidgetsGrid";
import { usePinnedWidgetsController } from "./usePinnedWidgetsController";

export type { CustomWidget } from "@/lib/reports/pinnedWidgetTypes";
export {
  getWidgetCollections,
  getFilteredRecords,
  computeWidgetSingleValue,
} from "@/lib/reports/widgetDataUtils";
export { getOrInitializeCustomWidgets } from "@/lib/reports/widgetDefaults";
export { DashboardWidgets } from "@/components/ui/reports/pinnedWidgets/DashboardWidgets";
export { WidgetBuilder } from "@/components/ui/reports/pinnedWidgets/WidgetBuilder";

/**
 * PinnedWidgets Main Module Component. Exposes custom Widget builders.
 */
export default function PinnedWidgets({ category }: { category: string }): React.JSX.Element {
  const {
    t,
    disabledCardIds,
    toggleCardVisibility,
    sectionSettings,
    toggleSectionSetting,
    widgets,
    filteredWidgets,
    collections,
    isBuilderOpen,
    editingWidgetId,
    defaultCollection,
    handleToggleBuilder,
    handleCancelBuilder,
    handleSaveWidget,
    handleDeleteWidget,
    handleTogglePin,
    handleEditClick,
    handleToggleSwitchStateLocal,
  } = usePinnedWidgetsController(category);

  return (
    <div className="space-y-4 font-sans text-start">
      <PinnedWidgetsChrome
        category={category}
        isBuilderOpen={isBuilderOpen}
        disabledCardIds={disabledCardIds}
        sectionSettings={sectionSettings}
        toggleCardVisibility={toggleCardVisibility}
        toggleSectionSetting={toggleSectionSetting}
        onToggleBuilder={handleToggleBuilder}
        t={t}
      />

      <PinnedWidgetsBuilderSection
        isBuilderOpen={isBuilderOpen}
        defaultCollection={defaultCollection}
        editWidgetConfig={widgets.find((widget) => widget.id === editingWidgetId) || null}
        category={category}
        onCancelEdit={handleCancelBuilder}
        onSaveWidget={handleSaveWidget}
      />

      <PinnedWidgetsGrid
        filteredWidgets={filteredWidgets}
        collections={collections}
        onTogglePin={handleTogglePin}
        onEditClick={handleEditClick}
        onDeleteWidget={handleDeleteWidget}
        onSwitchToggle={handleToggleSwitchStateLocal}
        t={t}
      />
    </div>
  );
}

