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
      className="flex-1 bg-muted/40 overflow-auto p-4 flex items-start justify-center relative min-h-[300px]"
    >
      <div
        ref={canvasRef}
        onMouseDown={onMouseDownBackground}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${canvasScale})`,
          transformOrigin: "top center",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
        className="relative bg-white text-black select-none transition-shadow rounded-sm border border-border flex-shrink-0"
      >
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
        )}

        {template.elements.map((el) => {
          const isSelected = selectedIds.includes(el.id) || selectedId === el.id;
          const st = el.style || {};

          let content = el.label;
          if (el.type === "field" && el.field && sampleData) {
            const val = (sampleData as Record<string, unknown>)[el.field];
            if (val != null) content = String(val);
          }

          return (
            <div
              key={el.id}
              onMouseDown={(e) => onMouseDownElement(e, el.id)}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                fontSize: st.fontSize || 10,
                fontWeight: st.fontWeight || "normal",
                color: st.color || PRINT_NEUTRAL.text,
                textAlign: st.textAlign || "left",
                direction: st.direction || "ltr",
                border: isSelected ? "1.5px solid #0284c7" : "1px dashed transparent",
                backgroundColor: isSelected ? "rgba(2, 132, 199, 0.05)" : "transparent",
                cursor: "move",
              }}
              className="group flex items-center overflow-hidden px-1"
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
                <div
                  onMouseDown={(e) => onMouseDownResize(e, el.id)}
                  className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-sky-600 border border-white cursor-se-resize"
                />
              )}
            </div>
          );
        })}

        {marquee && (
          <div
            style={{
              position: "absolute",
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
              backgroundColor: "rgba(2, 132, 199, 0.1)",
              border: "1px dashed #0284c7",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </main>
  );
}
