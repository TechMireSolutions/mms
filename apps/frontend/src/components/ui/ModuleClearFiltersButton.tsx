import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface ModuleClearFiltersButtonProps {
  label: string;
  onClearFilters: () => void;
  className?: string;
}

/** Shared Work toolbar clear-filters control (ghost + RefreshCw). */
export const ModuleClearFiltersButton = React.memo(function ModuleClearFiltersButton({
  label,
  onClearFilters,
  className,
}: ModuleClearFiltersButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClearFilters}
      className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE, className)}
    >
      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
});

