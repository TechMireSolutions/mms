/**
 * @file TemplateEditorCanvas.tsx
 * @description Central interactive visual design surface with selection handles, marquee, and drag-and-drop.
 */

import React from "react";
import { generateQrSvgUri } from "@/lib/qrCodeGenerator";
import {
  type DocumentTemplate,
  type PageSizeInfo,
} from "@mms/shared";
import { PRINT_NEUTRAL, type getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { boxesIntersect } from "./templateEditorUtils";

type PrintBrandingTokens = ReturnType<typeof getPrintBrandingTokens>;

export interface TemplateEditorCanvasProps<TPayload = Record<string, unknown>> {
  template: DocumentTemplate<TPayload>;
  selectedId?: string | null;
  selectedIds: string[];
  size: PageSizeInfo;
  canvasScale: number;
  showGuides: boolean;
  isPreviewMode?: boolean;
  canvasViewportRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  branding: {
    logoUrl?: string | null;
  };
  printTokens: PrintBrandingTokens;
  onDeselect: () => void;
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onSelectElements?: (elementIds: string[]) => void;
  sampleData?: TPayload;
  t: TranslationFunction;
}

export function TemplateEditorCanvas<TPayload = Record<string, unknown>>({
  template,
  selectedId,
  selectedIds,
  size,
  canvasScale,
  showGuides,
  isPreviewMode = false,
  canvasViewportRef,
  canvasRef,
  branding,
  printTokens,
  onDeselect,
  onMouseDownElement,
  onMouseDownResize,
  onSelectElements,
  sampleData,
}: TemplateEditorCanvasProps<TPayload>): React.JSX.Element {
  const [marquee, setMarquee] = React.useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const marqueeMovedRef = React.useRef(false);
  const isShiftRef = React.useRef(false);

  const onMouseDownBackground = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = (event.clientX - rect.left) / canvasScale;
    const startY = (event.clientY - rect.top) / canvasScale;
    marqueeMovedRef.current = false;
    isShiftRef.current = event.shiftKey || event.metaKey || event.ctrlKey;
    setMarquee({ startX, startY, currentX: startX, currentY: startY });
  };

  React.useEffect(() => {
    if (!marquee) return;
    const onMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (event.clientX - rect.left) / canvasScale;
      const currentY = (event.clientY - rect.top) / canvasScale;
      if (Math.abs(currentX - marquee.startX) > 4 || Math.abs(currentY - marquee.startY) > 4) {
        marqueeMovedRef.current = true;
      }
      setMarquee((prev) => (prev ? { ...prev, currentX, currentY } : null));
    };

    const onMouseUp = () => {
      if (marqueeMovedRef.current) {
        const box = {
          x: Math.min(marquee.startX, marquee.currentX),
          y: Math.min(marquee.startY, marquee.currentY),
          w: Math.abs(marquee.currentX - marquee.startX),
          h: Math.abs(marquee.currentY - marquee.startY),
        };
        const hitIds = template.elements
          .filter((el) => boxesIntersect(box, { x: el.x, y: el.y, w: el.w, h: el.h }))
          .map((el) => el.id);

        if (onSelectElements) {
          if (isShiftRef.current) {
            const combined = Array.from(new Set([...selectedIds, ...hitIds]));
            onSelectElements(combined);
          } else {
            onSelectElements(hitIds);
          }
        }
      } else {
        onDeselect();
      }
      setMarquee(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [marquee, canvasScale, onDeselect, onSelectElements, selectedIds, template.elements]);

  return (
    <main
      ref={canvasViewportRef as React.RefObject<HTMLDivElement>}
      className="flex-1 bg-muted/30 overflow-auto p-6 flex flex-col items-center justify-start relative min-h-[300px] select-none"
    >
      <div className="mb-3 px-3 py-1 rounded-full bg-background/80 border border-border/80 text-[11px] text-muted-foreground font-mono shadow-2xs backdrop-blur-xs flex items-center gap-2">
        <span className="font-semibold text-foreground">{size.label}</span>
        <span>•</span>
        <span>{size.width} × {size.height} pt</span>
        {isPreviewMode && (
          <>
            <span>•</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">Preview Mode</span>
          </>
        )}
      </div>

      <div
        ref={canvasRef}
        onMouseDown={onMouseDownBackground}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${canvasScale})`,
          transformOrigin: "top center",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)",
        }}
        className="relative bg-white text-black select-none transition-shadow rounded-xs border border-border/40 flex-shrink-0"
      >
        {!isPreviewMode && showGuides && (
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
        )}

        {template.elements.map((el) => {
          const isSelected = !isPreviewMode && (selectedIds.includes(el.id) || selectedId === el.id);
          const st = el.style || {};

          let content = el.label;
          if (el.type === "field" && el.field && sampleData) {
            const val = (sampleData as Record<string, unknown>)[el.field];
            if (val != null) content = String(val);
          }

          return (
            <div
              key={el.id}
              role="button"
              tabIndex={isPreviewMode ? -1 : 0}
              aria-label={`${el.label || el.type} element`}
              aria-selected={isSelected}
              onMouseDown={(e) => {
                if (!isPreviewMode) onMouseDownElement(e, el.id);
              }}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                fontSize: st.fontSize || 10,
                fontWeight: st.fontWeight || "normal",
                fontStyle: st.fontStyle || "normal",
                fontFamily: st.fontFamily || "inherit",
                color: st.color || PRINT_NEUTRAL.text,
                textAlign: st.textAlign || "left",
                direction: st.direction || "ltr",
                border: isSelected ? "1.5px solid #0284c7" : "1px dashed transparent",
                backgroundColor: isSelected ? "rgba(2, 132, 199, 0.05)" : "transparent",
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
                  <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    Logo
                  </div>
                )
              ) : (
                <span className="truncate w-full">{content}</span>
              )}

              {isSelected && (
                <>
                  <div
                    onMouseDown={(e) => onMouseDownResize(e, el.id)}
                    className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-white border-2 border-sky-600 shadow-xs cursor-se-resize translate-x-1/2 translate-y-1/2 rtl:-translate-x-1/2 z-10 hover:scale-125 transition-transform"
                    title="Drag to resize"
                  />
                  <div className="absolute -top-5 start-0 bg-sky-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none z-10">
                    {`${Math.round(el.w)} × ${Math.round(el.h)}`}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {!isPreviewMode && marquee && (
          <div
            style={{
              position: "absolute",
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
              backgroundColor: "rgba(2, 132, 199, 0.08)",
              border: "1px dashed #0284c7",
              borderRadius: "2px",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </main>
  );
}
