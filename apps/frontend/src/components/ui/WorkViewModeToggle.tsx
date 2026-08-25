import React from "react";
import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { cn } from "@/lib/utils";

export interface WorkViewModeToggleProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  className?: string;
  disabled?: boolean;
}

export const WorkViewModeToggle = React.memo(function WorkViewModeToggle({
  viewMode,
  onViewModeChange,
  className,
  disabled = false,
}: WorkViewModeToggleProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs",
        className,
      )}
      role="group"
      aria-label={t("common.viewMode.group")}
    >
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => onViewModeChange("table")}
        className={cn(
          "min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all",
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={t("common.viewMode.table")}
        aria-pressed={viewMode === "table"}
      >
        <Table className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => onViewModeChange("cards")}
        className={cn(
          "min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all",
          viewMode === "cards"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={t("common.viewMode.cards")}
        aria-pressed={viewMode === "cards"}
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
});
