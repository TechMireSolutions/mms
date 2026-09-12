import type { BrandingSettings } from "@mms/shared";
import {
  PAGE_SIZES,
  getPageDimensions,
  type PageSizeInfo,
  type ElementStyle,
  type TemplateElement,
  type TemplateOrientation,
  type DocumentTemplate,
} from "@mms/shared";

export { PAGE_SIZES, getPageDimensions };
export type { PageSizeInfo, ElementStyle, TemplateElement, TemplateOrientation };
export type InvoiceTemplate = DocumentTemplate<Record<string, unknown>>;
export type BrandingInfo = BrandingSettings;

export interface LookupItem {
  id: string | number;
  name?: string;
  code?: string;
  mujtahid_id?: string | number;
  phone?: string | null;
  email?: string | null;
}

export interface FieldLookupInfo {
  contacts?: LookupItem[];
  users?: LookupItem[];
  obligationTypes?: LookupItem[];
  mujtahids?: LookupItem[];
  reps?: LookupItem[];
  currencies?: LookupItem[];
}
