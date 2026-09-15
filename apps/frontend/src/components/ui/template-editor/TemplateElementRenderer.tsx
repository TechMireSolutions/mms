/**
 * @file TemplateElementRenderer.tsx
 * @description Memoized visual renderer for individual canvas elements with 8-point selection handles, table primitives, and a11y.
 */

import React from "react";
import { generateQrSvgUri } from "@/lib/qrCodeGenerator";
import { isRtlText, type DocumentTemplate } from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { interpolateTemplateTokens } from "./templateEditorUtils";
import type { ResizeHandle } from "./useTemplateEditorInteractions";

export interface TemplateElementRendererProps<TPayload = Record<string, unknown>> {
  el: DocumentTemplate<TPayload>["elements"][number];
  isSelected: boolean;
  isPreviewMode: boolean;
  branding: {
    logoUrl?: string | null;
  };
  sampleData?: TPayload;
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string, handle?: ResizeHandle) => void;
  onDeleteElement: (elementId: string) => void;
  t: TranslationFunction;
}

const RESIZE_HANDLES: { handle: ResizeHandle; style: React.CSSProperties; cursor: string }[] = [
  { handle: "n", style: { top: -4, left: "calc(50% - 6px)" }, cursor: "cursor-ns-resize" },
  { handle: "s", style: { bottom: -4, left: "calc(50% - 6px)" }, cursor: "cursor-ns-resize" },
  { handle: "w", style: { left: -4, top: "calc(50% - 6px)" }, cursor: "cursor-ew-resize" },
  { handle: "e", style: { right: -4, top: "calc(50% - 6px)" }, cursor: "cursor-ew-resize" },
  { handle: "nw", style: { top: -5, left: -5 }, cursor: "cursor-nwse-resize" },
  { handle: "ne", style: { top: -5, right: -5 }, cursor: "cursor-nesw-resize" },
  { handle: "sw", style: { bottom: -5, left: -5 }, cursor: "cursor-nesw-resize" },
  { handle: "se", style: { bottom: -5, right: -5 }, cursor: "cursor-se-resize" },
];

const DEFAULT_TABLE_ROWS: Record<string, unknown>[] = [
  { id: "1", description: "Tuition / Fee Item 1", amount: "300.00" },
  { id: "2", description: "Syllabus / Materials", amount: "100.00" },
  { id: "3", description: "Activity & Facilities", amount: "50.00" },
];

export const TemplateElementRenderer = React.memo(function TemplateElementRenderer<
  TPayload = Record<string, unknown>
>({
  el,
  isSelected,
  isPreviewMode,
  branding,
  sampleData,
  onMouseDownElement,
  onMouseDownResize,
  onDeleteElement,
  t,
}: TemplateElementRendererProps<TPayload>) {
  const [logoLoadFailed, setLogoLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoLoadFailed(false);
  }, [branding.logoUrl]);

  const qrPayload = React.useMemo(() => {
    if (el.type !== "qrcode") return "";
    if (el.field && sampleData) {
      const fieldVal = (sampleData as Record<string, unknown>)[el.field];
      if (fieldVal) return String(fieldVal);
    }
    if (el.label && el.label !== t("templateEditor.qrCode") && el.label !== "QR Code") {
      return el.label;
    }
    return branding.logoUrl || "MMS-DOC";
  }, [el.type, el.field, el.label, sampleData, branding.logoUrl, t]);

  const qrSvgUri = React.useMemo(
    () => (el.type === "qrcode" ? generateQrSvgUri(qrPayload) : ""),
    [el.type, qrPayload]
  );

  const st = el.style || {};

  let content = el.label;
  if (el.type === "field" && el.field && sampleData) {
    const val = (sampleData as Record<string, unknown>)[el.field];
    if (val != null && String(val).trim() !== "") {
      content = String(val);
    } else if (!isPreviewMode) {
      content = `{${el.field}}`;
    } else {
      content = "";
    }
  } else if (sampleData) {
    content = interpolateTemplateTokens(content, sampleData as Record<string, unknown>);
  }
  if (!content.trim() && !isPreviewMode) {
    content = el.label || `{${el.type}}`;
  }

  const isArabic = isRtlText(content);
  const elementDirection = st.direction || (isArabic ? "rtl" : "ltr");
  const elementTextAlign = st.textAlign || (isArabic ? "right" : "left");
  const defaultColAlign = elementDirection === "rtl" ? "right" : "left";
  const tableFontSize = st.fontSize ? Math.max(7, st.fontSize - 2) : 9;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isPreviewMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onMouseDownElement(e as unknown as React.MouseEvent, el.id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      onDeleteElement(el.id);
    }
  };

  const elementAriaLabel = el.label
    ? `${el.label} (${el.type})`
    : `${t("templateEditor.element")} ${el.type}`;

  // Find array rows for table primitives if available
  let tableRows: Record<string, unknown>[] = DEFAULT_TABLE_ROWS;
  if (el.type === "table" && sampleData && typeof sampleData === "object") {
    for (const key of Object.keys(sampleData)) {
      const val = (sampleData as Record<string, unknown>)[key];
      if (Array.isArray(val) && val.length > 0) {
        tableRows = val as Record<string, unknown>[];
        break;
      }
    }
  }

  return (
    <div
      dir={elementDirection}
      role={isPreviewMode ? undefined : "button"}
      tabIndex={isPreviewMode ? -1 : 0}
      aria-label={elementAriaLabel}
      aria-pressed={isSelected}
      onMouseDown={(e) => {
        if (!isPreviewMode) onMouseDownElement(e, el.id);
      }}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        fontSize: st.fontSize || 10,
        fontWeight: st.fontWeight || "normal",
        fontStyle: st.fontStyle || "normal",
        textDecoration: st.textDecoration || "none",
        fontFamily: st.fontFamily || "inherit",
        color: st.color || PRINT_NEUTRAL.text,
        textAlign: elementTextAlign,
        direction: elementDirection,
        border: isSelected
          ? "1.5px solid #0284c7"
          : st.borderWidth
          ? `${st.borderWidth}px solid ${st.borderColor || "#cbd5e1"}`
          : "1px dashed transparent",
        borderRadius: st.borderRadius != null ? `${st.borderRadius}px` : undefined,
        backgroundColor: isSelected
          ? "rgba(2, 132, 199, 0.06)"
          : st.backgroundColor || "transparent",
        cursor: isPreviewMode ? "default" : "move",
      }}
      className={`group flex items-center overflow-visible px-1 focus-visible:outline-2 focus-visible:outline-sky-600 ${
        !isPreviewMode && !isSelected ? "hover:border-sky-400/40" : ""
      }`}
    >
      {el.type === "divider" ? (
        <hr
          style={{
            borderColor: st.borderColor || st.color || "#cbd5e1",
            borderTopWidth: st.borderWidth != null ? `${st.borderWidth}px` : "1px",
          }}
          className="w-full border-0 border-t m-0"
        />
      ) : el.type === "qrcode" ? (
        <img
          src={qrSvgUri}
          alt={t("templateEditor.qrCode")}
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : el.type === "logo" ? (
        branding.logoUrl && !logoLoadFailed ? (
          <img
            src={branding.logoUrl}
            alt={t("templateEditor.logo")}
            onError={() => setLogoLoadFailed(true)}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center text-2xs text-slate-400 font-medium">
            {t("templateEditor.logoPlaceholder")}
          </div>
        )
      ) : el.type === "table" ? (
        <div className="w-full h-full overflow-hidden flex flex-col select-none text-xs pointer-events-none">
          {el.tableConfig?.showHeader !== false && (
            <div
              style={{
                fontSize: `${tableFontSize}px`,
                backgroundColor: el.tableConfig?.headerBackground || "#f1f5f9",
                borderBottom: `1px solid ${el.tableConfig?.borderColor || "#cbd5e1"}`,
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
            {tableRows.slice(0, 4).map((row, rIdx) => (
              <div
                key={rIdx}
                style={{
                  fontSize: `${tableFontSize}px`,
                  height: el.tableConfig?.rowHeight || 22,
                  backgroundColor: el.tableConfig?.zebra && rIdx % 2 === 1 ? "rgba(0,0,0,0.03)" : "transparent",
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
      ) : (
        <span
          className={`w-full ${
            el.h > 32 || content.includes("\n")
              ? "break-words whitespace-pre-wrap leading-tight"
              : "truncate"
          }`}
        >
          {content}
        </span>
      )}

      {isSelected && !isPreviewMode && (
        <>
          {RESIZE_HANDLES.map(({ handle, style, cursor }) => (
            <div
              key={handle}
              tabIndex={-1}
              aria-hidden="true"
              onMouseDown={(e) => onMouseDownResize(e, el.id, handle)}
              style={style}
              className={`absolute w-3 h-3 rounded-xs bg-white border-2 border-sky-600 shadow-xs z-elevated hover:scale-125 hover:bg-sky-50 transition-transform touch-none ${cursor}`}
              title={t("templateEditor.dragToResize")}
            />
          ))}
          <div
            style={{ left: 0, top: el.y < 24 ? el.h + 4 : -22 }}
            aria-live="polite"
            className="absolute bg-sky-600 text-white font-mono text-3xs font-medium px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none z-sticky"
          >
            {`${Math.round(el.w)} × ${Math.round(el.h)}`}
          </div>
        </>
      )}
    </div>
  );
}) as <TPayload>(props: TemplateElementRendererProps<TPayload>) => React.JSX.Element;
