import type { BrandingSettings } from "@mms/shared";

export interface PageSizeInfo {
  width: number;
  height: number;
  label: string;
}

export const PAGE_SIZES: Record<string, PageSizeInfo> = {
  A6: { width: 397, height: 559, label: "A6 (105×148mm)" },
  A5: { width: 559, height: 794, label: "A5 (148×210mm)" },
  A4: { width: 794, height: 1123, label: "A4 (210×297mm)" },
  Letter: { width: 816, height: 1056, label: "Letter (8.5×11in)" },
};

export interface ElementStyle {
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "right" | "center" | "justify";
  color?: string;
  fontFamily?: string;
  direction?: "ltr" | "rtl";
  fontStyle?: "normal" | "italic";
}

export interface TemplateElement {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: ElementStyle;
  field?: string;
}

export interface InvoiceTemplate {
  pageSize: string;
  elements: TemplateElement[];
}

export type BrandingInfo = BrandingSettings;

export interface LookupItem {
  id: string | number;
  name?: string;
  code?: string;
  mujtahid_id?: string | number;
}

export interface FieldLookupInfo {
  contacts?: LookupItem[];
  users?: LookupItem[];
  obligationTypes?: LookupItem[];
  mujtahids?: LookupItem[];
  reps?: LookupItem[];
  currencies?: LookupItem[];
}
