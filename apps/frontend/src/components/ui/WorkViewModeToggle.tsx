import React from "react";
import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

export const WorkViewModeToggle = React.memo(function WorkViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs"
      role="group"
      aria-label={t("common.viewMode.group")}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("table")}
        className={`min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("common.viewMode.table")}
        aria-pressed={viewMode === "table"}
      >
        <Table className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("cards")}
        className={`min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "cards"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("common.viewMode.cards")}
        aria-pressed={viewMode === "cards"}
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
});

