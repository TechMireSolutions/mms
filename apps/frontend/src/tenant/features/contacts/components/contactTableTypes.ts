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
