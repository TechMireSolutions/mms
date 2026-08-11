import React, { Fragment } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ActiveFilterBannerChip {
  key: string;
  label?: string;
  value: string;
}

export interface ActiveFilterBannerAction {
  key: string;
  label: string;
  onClick: () => void;
}

export interface ActiveFilterBannerProps {
  /** Optional global label rendered once before the chips (e.g. Student "Filters"). */
  label?: string;
  chips: readonly ActiveFilterBannerChip[];
  actions: readonly ActiveFilterBannerAction[];
}

/** Canonical active-filter banner chrome — SSOT for report filter pills/clear actions. */
export function ActiveFilterBanner({
  label,
  chips,
  actions,
}: ActiveFilterBannerProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        {label && <span className="font-medium text-foreground">{label}</span>}
        {chips.map((chip) => (
          <Fragment key={chip.key}>
            {chip.label && <span className="font-medium text-foreground">{chip.label}</span>}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {chip.value}
            </span>
          </Fragment>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {actions.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
