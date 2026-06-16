import React from "react";

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
  active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:  { label: "Inactive",  cls: "bg-muted text-muted-foreground border-border" },
  suspended: { label: "Suspended", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid:      { label: "Paid",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue:   { label: "Overdue",   cls: "bg-destructive/10 text-destructive border-destructive/20" },
  partial:   { label: "Partial",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  upcoming:  { label: "Upcoming",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ongoing:   { label: "Ongoing",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  success:   { label: "Success",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed:    { label: "Failed",    cls: "bg-destructive/10 text-destructive border-destructive/20" },
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground border-border" },
};

/**
 * StatusBadge — unified pill badge for any status.
 *
 * @param {StatusBadgeProps} props - The component props.
 * @returns {React.ReactElement} The rendered StatusBadge component.
 */
export default function StatusBadge({
  status,
  config = {},
  size = "md",
}: StatusBadgeProps): React.ReactElement {
  const map = { ...DEFAULT_CONFIG, ...(config || {}) };
  const cfg = map[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  const sizeClass = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";

  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${sizeClass} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
