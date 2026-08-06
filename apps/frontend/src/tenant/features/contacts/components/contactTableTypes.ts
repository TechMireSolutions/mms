import type React from "react";

export interface ContactsColumnConfig {
  id: string;
  label: string;
  sortField?: string;
  width?: number;
}

export function columnWidthStyle(width: number | undefined): React.CSSProperties | undefined {
  if (typeof width !== "number") return undefined;
  return { width, minWidth: width, maxWidth: width };
}

/** Sticky checkbox/name cell background aligned with selected/hover row tint. */
export function contactStickyCellBg(isSelected: boolean): string {
  return isSelected
    ? "bg-primary/5 group-hover:bg-primary/10"
    : "bg-card group-hover:bg-muted/40";
}
