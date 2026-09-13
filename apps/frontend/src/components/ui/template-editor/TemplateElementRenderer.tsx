/**
 * @file TemplateElementRenderer.tsx
 * @description Memoized visual renderer for individual canvas elements with selection handles and a11y.
 */

import React from "react";
import { generateQrSvgUri } from "@/lib/qrCodeGenerator";
import type { DocumentTemplate } from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateElementRendererProps<TPayload = Record<string, unknown>> {
  el: DocumentTemplate<TPayload>["elements"][number];
  isSelected: boolean;
  isPreviewMode: boolean;
  branding: {
    logoUrl?: string | null;
  };
  sampleData?: TPayload;
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string, handle?: "se" | "e" | "s") => void;
  onDeleteElement: (elementId: string) => void;
  t: TranslationFunction;
}

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
  const st = el.style || {};

  let content = el.label;
  if (el.type === "field" && el.field && sampleData) {
    const val = (sampleData as Record<string, unknown>)[el.field];
    if (val != null) content = String(val);
  }

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

  return (
    <div
      role="button"
      tabIndex={isPreviewMode ? -1 : 0}
      aria-label={elementAriaLabel}
      aria-pressed={isSelected}
      onClick={(e) => {
        if (!isPreviewMode) onMouseDownElement(e, el.id);
      }}
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
        textAlign: st.textAlign || "left",
        direction: st.direction || "ltr",
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
        <hr className="w-full border-t border-slate-300" />
      ) : el.type === "qrcode" ? (
        <img
          src={generateQrSvgUri(branding.logoUrl || "MMS-DOC")}
          alt="QR"
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : el.type === "logo" ? (
        branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain pointer-events-none" />
        ) : (
          <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center text-2xs text-slate-400 font-medium">
            {t("templateEditor.logoPlaceholder")}
          </div>
        )
      ) : (
        <span className="truncate w-full">{content}</span>
      )}

      {isSelected && !isPreviewMode && (
        <>
          {/* Top-Left corner marker */}
          <div
            aria-hidden="true"
            className="absolute -top-1 -start-1 w-1.5 h-1.5 bg-white border border-sky-600 rounded-2xs pointer-events-none z-10"
          />
          {/* Top-Right corner marker */}
          <div
            aria-hidden="true"
            className="absolute -top-1 -end-1 w-1.5 h-1.5 bg-white border border-sky-600 rounded-2xs pointer-events-none z-10"
          />
          {/* Bottom-Left corner marker */}
          <div
            aria-hidden="true"
            className="absolute -bottom-1 -start-1 w-1.5 h-1.5 bg-white border border-sky-600 rounded-2xs pointer-events-none z-10"
          />

          {/* East (width) handle */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t("templateEditor.dragToResize")}
            onMouseDown={(e) => onMouseDownResize(e, el.id, "e")}
            style={{
              right: -4,
              top: "calc(50% - 6px)",
            }}
            className="absolute w-2.5 h-3 rounded-xs bg-white border-2 border-sky-600 shadow-xs cursor-ew-resize z-10 hover:scale-125 hover:bg-sky-50 transition-transform focus-visible:ring-2 focus-visible:ring-sky-600"
            title={t("templateEditor.dragToResize")}
          />
          {/* South (height) handle */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t("templateEditor.dragToResize")}
            onMouseDown={(e) => onMouseDownResize(e, el.id, "s")}
            style={{
              bottom: -4,
              left: "calc(50% - 6px)",
            }}
            className="absolute w-3 h-2.5 rounded-xs bg-white border-2 border-sky-600 shadow-xs cursor-ns-resize z-10 hover:scale-125 hover:bg-sky-50 transition-transform focus-visible:ring-2 focus-visible:ring-sky-600"
            title={t("templateEditor.dragToResize")}
          />
          {/* South-East (2D) handle */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t("templateEditor.dragToResize")}
            onMouseDown={(e) => onMouseDownResize(e, el.id, "se")}
            style={{
              right: -5,
              bottom: -5,
            }}
            className="absolute w-3 h-3 rounded-xs bg-white border-2 border-sky-600 shadow-xs cursor-se-resize z-10 hover:scale-125 hover:bg-sky-50 transition-transform focus-visible:ring-2 focus-visible:ring-sky-600"
            title={t("templateEditor.dragToResize")}
          />
          <div
            style={{ left: 0, top: -22 }}
            className="absolute bg-sky-600 text-white font-mono text-3xs font-medium px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none z-20"
          >
            {`${Math.round(el.w)} × ${Math.round(el.h)}`}
          </div>
        </>
      )}
    </div>
  );
}) as <TPayload>(props: TemplateElementRendererProps<TPayload>) => React.JSX.Element;
