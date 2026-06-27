import React from "react";
import { cn } from "@/lib/utils";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

export interface StatusBadgeConfigItem {
  label: string;
  cls: string;
}

export interface StatusBadgeProps {
  status: string;
  config?: Record<string, StatusBadgeConfigItem>;
  size?: "sm" | "md";
}

const DEFAULT_CONFIG: Record<string, StatusBadgeConfigItem> = {
  active:    { label: "Active",    cls: SEMANTIC_BADGE.success },
  inactive:  { label: "Inactive",  cls: SEMANTIC_BADGE.muted },
  suspended: { label: "Suspended", cls: SEMANTIC_BADGE.warning },
  pending:   { label: "Pending",   cls: SEMANTIC_BADGE.warning },
  paid:      { label: "Paid",      cls: SEMANTIC_BADGE.success },
  overdue:   { label: "Overdue",   cls: SEMANTIC_BADGE.destructive },
  partial:   { label: "Partial",   cls: SEMANTIC_BADGE.info },
  cancelled: { label: "Cancelled", cls: SEMANTIC_BADGE.muted },
  completed: { label: "Completed", cls: SEMANTIC_BADGE.success },
  upcoming:  { label: "Upcoming",  cls: SEMANTIC_BADGE.info },
  ongoing:   { label: "Ongoing",   cls: SEMANTIC_BADGE.warning },
  success:   { label: "Success",   cls: SEMANTIC_BADGE.success },
  failed:    { label: "Failed",    cls: SEMANTIC_BADGE.destructive },
  posted:    { label: "Posted",    cls: SEMANTIC_BADGE.successStrong },
  draft:     { label: "Draft",     cls: SEMANTIC_BADGE.muted },
};

export function StatusBadge({
  status,
  config = {},
  size = "md",
}: StatusBadgeProps): React.ReactElement {
  const map = { ...DEFAULT_CONFIG, ...(config || {}) };
  const cfg = map[status] || { label: status, cls: SEMANTIC_BADGE.muted };
  const sizeClass = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";

  return (
    <span className={cn('inline-flex items-center font-bold rounded-full border', sizeClass, cfg.cls)}>
      {cfg.label}
    </span>
  );
}
