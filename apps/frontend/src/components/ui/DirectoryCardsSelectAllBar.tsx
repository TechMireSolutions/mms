import type { ReactElement, ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface DirectoryCardsSelectAllBarProps {
  checkboxId: string;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  selectLabel: string;
  deselectLabel: string;
  selectedCount: number;
  selectedCountLabel: ReactNode;
  pageCountLabel: ReactNode;
  className?: string;
}

/** Shared Work cards select-all strip (Contacts / Students SSOT). */
export function DirectoryCardsSelectAllBar({
  checkboxId,
  allSelected,
  someSelected,
  onSelectAll,
  selectLabel,
  deselectLabel,
  selectedCount,
  selectedCountLabel,
  pageCountLabel,
  className,
}: DirectoryCardsSelectAllBarProps): ReactElement {
  return (
    <div
      className={cn(
        WORK_SURFACE,
        "mb-3.5 flex items-center justify-between border-border/40 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex min-h-11 min-w-11 items-center justify-center">
          <Checkbox
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={onSelectAll}
            id={checkboxId}
          />
        </div>
        <label
          htmlFor={checkboxId}
          className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-foreground transition-colors"
        >
          {allSelected ? deselectLabel : selectLabel}
        </label>
      </div>
      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/10">
        {selectedCount > 0 ? (
          <>
            {selectedCountLabel}
            <span className="mx-1.5 text-border" aria-hidden="true">
              ·
            </span>
            {pageCountLabel}
          </>
        ) : (
          pageCountLabel
        )}
      </span>
    </div>
  );
}
