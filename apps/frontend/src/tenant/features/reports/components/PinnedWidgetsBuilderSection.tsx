import type React from "react";
import { AnimatePresence } from "framer-motion";
import { WidgetBuilder } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilder";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";

interface PinnedWidgetsBuilderSectionProps {
  isBuilderOpen: boolean;
  defaultCollection: CustomWidget["collection"];
  editWidgetConfig: CustomWidget | null;
  category: string;
  onCancelEdit: () => void;
  onSaveWidget: (savedWidget: CustomWidget) => void;
}

export function PinnedWidgetsBuilderSection({
  isBuilderOpen,
  defaultCollection,
  editWidgetConfig,
  category,
  onCancelEdit,
  onSaveWidget,
}: PinnedWidgetsBuilderSectionProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {isBuilderOpen && (
        <WidgetBuilder
          initialCollection={defaultCollection}
          editWidgetConfig={editWidgetConfig}
          onCancelEdit={onCancelEdit}
          onSaveWidget={onSaveWidget}
          category={category}
        />
      )}
    </AnimatePresence>
  );
}
