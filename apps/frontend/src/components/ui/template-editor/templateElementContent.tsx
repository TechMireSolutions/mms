/**
 * @file templateElementContent.tsx
 * @description Single source of truth for how a template element's *content* is
 * rendered, shared by the editor canvas and the print/PDF renderer. Data resolution
 * lives in `templateDataResolution.ts`.
 *
 * Before this module there were two independent renderers. They disagreed on defaults
 * (RTL auto-detection, font stack, truncation) and the print renderer had no `table`
 * branch at all, so a table designed in the editor printed as the word "Table".
 */

import React from "react";
import { generateQrSvgUri } from "@/lib/qrCodeGenerator";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  TABLE_FALLBACK_ROWS,
  resolveElementText,
  resolveQrPayload,
  resolveTableRows,
  visibleTableRowCount,
  type ElementGeometry,
  type TemplateRenderMode,
} from "./templateDataResolution";

/*
 * Re-exported so the two renderers keep a single import site for element rendering,
 * while the pure resolvers live in their own (300-line-ceiling-friendly) module.
 */
export * from "./templateDataResolution";

export interface TemplateElementContentProps {
  el: TemplateElement;
  /** Flat field→value payload; `null` means "no data available". */
  data?: Record<string, unknown> | null;
  mode: TemplateRenderMode;
  /** Institution logo, used by `logo` elements. */
  logoUrl?: string | null;
  /** Resolved writing direction/text alignment for the element box. */
  geometry: ElementGeometry;
  /** Called when a logo image fails to load. */
  onLogoError?: () => void;
  /** Print omits a missing logo rather than printing a placeholder box. */
  hideMissingLogo?: boolean;
  /** Payload built by the caller (e.g. a receipt verification URL for print). */
  qrPayload?: string | null;
  /** Called when the logo image failed to load (editor keeps a placeholder). */
  logoFailed?: boolean;
  interpolate: (text: string, data: Record<string, unknown>) => string;
  t: TranslationFunction;
}

export function TemplateElementContent({
  el,
  data,
  mode,
  logoUrl,
  geometry,
  hideMissingLogo = false,
  qrPayload = null,
  logoFailed = false,
  onLogoError,
  interpolate,
  t,
}: TemplateElementContentProps): React.JSX.Element | null {
  const st = (el.style || {}) as ElementStyle;
  const tableFontSize = st.fontSize ? Math.max(7, st.fontSize - 2) : 9;
  const defaultColAlign = geometry.direction === "rtl" ? "right" : "left";

  if (el.type === "divider") {
    return (
      <hr
        style={{
          borderColor: st.borderColor || st.color || PRINT_NEUTRAL.border,
          borderTopWidth: st.borderWidth != null ? `${st.borderWidth}px` : "1px",
        }}
        className="w-full border-0 border-t m-0"
      />
    );
  }

  if (el.type === "qrcode") {
    const payload = resolveQrPayload(el, data, {
      explicitPayload: qrPayload,
      qrCodeLabel: t("templateEditor.qrCode"),
      placeholder: logoUrl || "MMS-DOC",
    });
    return (
      <img
        src={generateQrSvgUri(payload, st.color || "#000000")}
        alt={t("templateEditor.qrCode")}
        className="w-full h-full object-contain pointer-events-none"
      />
    );
  }

  if (
    el.type === "logo" ||
    el.type === "avatar" ||
    el.type === "photo" ||
    el.type === "image"
  ) {
    const isPhotoTarget =
      el.field === "photo" ||
      el.field === "student_photo" ||
      el.field === "avatar" ||
      el.id === "student_photo" ||
      el.type === "avatar" ||
      el.type === "photo";

    if (isPhotoTarget) {
      const photoVal =
        (data?.photo as string) ||
        (data?.student_photo as string) ||
        (data?.avatar as string);

      if (
        photoVal &&
        typeof photoVal === "string" &&
        (photoVal.startsWith("http") || photoVal.startsWith("data:") || photoVal.startsWith("/"))
      ) {
        return (
          <img
            src={photoVal}
            alt={t("students.cardTemplate.field.photo") || "Student Photo"}
            className="w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: st.borderRadius != null ? `${st.borderRadius}px` : undefined }}
          />
        );
      }

      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground select-none pointer-events-none"
          style={{ borderRadius: st.borderRadius != null ? `${st.borderRadius}px` : undefined }}
        >
          <svg
            className="w-1/2 h-1/2 opacity-60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-4xs font-semibold uppercase tracking-wider mt-0.5 opacity-75">
            {t("students.cardTemplate.field.photo") || "Photo"}
          </span>
        </div>
      );
    }

    if (logoUrl && !logoFailed) {
      return (
        <img
          src={logoUrl}
          alt={t("templateEditor.logo")}
          onError={onLogoError}
          className="w-full h-full object-contain pointer-events-none"
        />
      );
    }
    if (hideMissingLogo) return null;
    return (
      <div className="w-full h-full border border-dashed border-border flex items-center justify-center text-2xs text-muted-foreground font-medium">
        {t("templateEditor.logoPlaceholder")}
      </div>
    );
  }

  if (el.type === "table") {
    const resolvedRows = resolveTableRows(el, data);
    // Print never invents rows; the editor shows placeholders so the layout is visible.
    const rows = (resolvedRows ?? (mode === "print" ? [] : TABLE_FALLBACK_ROWS)).slice(
      0,
      visibleTableRowCount(el)
    );
    return (
      <div className="w-full h-full overflow-hidden flex flex-col select-none text-xs pointer-events-none">
        {el.tableConfig?.showHeader !== false && (
          <div
            style={{
              fontSize: `${tableFontSize}px`,
              backgroundColor: el.tableConfig?.headerBackground || "#f1f5f9",
              borderBottom: `1px solid ${el.tableConfig?.borderColor || PRINT_NEUTRAL.border}`,
            }}
            className="flex items-center font-bold uppercase tracking-wider text-muted-foreground shrink-0 px-1 py-1"
          >
            {(el.columns || []).map((col, idx) => (
              <div
                key={idx}
                style={{
                  width: col.width ? `${col.width}px` : undefined,
                  flex: col.width ? undefined : 1,
                  textAlign: col.align || defaultColAlign,
                }}
                className="truncate px-1"
              >
                {col.header}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-hidden divide-y divide-border/40">
          {rows.map((row, rIdx) => (
            <div
              key={rIdx}
              style={{
                fontSize: `${tableFontSize}px`,
                height: el.tableConfig?.rowHeight || 22,
                backgroundColor:
                  el.tableConfig?.zebra && rIdx % 2 === 1 ? "rgba(0,0,0,0.03)" : "transparent",
              }}
              className="flex items-center px-1"
            >
              {(el.columns || []).map((col, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    width: col.width ? `${col.width}px` : undefined,
                    flex: col.width ? undefined : 1,
                    textAlign: col.align || defaultColAlign,
                  }}
                  className="truncate px-1"
                >
                  {String(row[col.field] ?? row[col.header.toLowerCase()] ?? "-")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // static / field text
  const content = resolveElementText(el, data, mode, interpolate);
  const isEmptyBoundField = el.type === "field" && content === "";
  if (isEmptyBoundField && mode === "edit") {
    return (
      <span className="w-full truncate italic text-muted-foreground/70">
        {`{${el.field}}`}
      </span>
    );
  }
  if (isEmptyBoundField) {
    // Print/export shows a neutral dash where a bound value is empty.
    return <span className="w-full truncate">—</span>;
  }

  /*
   * Text wraps and is never ellipsized — in the editor *or* on paper.
   *
   * The canvas used to cut long values with an ellipsis while print showed the full
   * text running over its neighbours, so a designer working from the canvas could not
   * see the collision they were creating. Ellipsizing in both places would be
   * "consistent" but silently drops data from a printed receipt, so the choice is to
   * show the real, possibly-overflowing text everywhere and let the designer fix it.
   */
  return (
    <span className="w-full break-words whitespace-pre-wrap leading-tight">{content}</span>
  );
}
