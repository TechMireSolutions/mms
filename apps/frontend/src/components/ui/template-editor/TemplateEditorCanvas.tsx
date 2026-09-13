/**
 * @file TemplateEditorCanvas.tsx
 * @description Central interactive visual design surface with selection handles, marquee, drag-and-drop, and canvas empty state.
 */

import React, { useEffectEvent } from "react";
import { LayoutTemplate } from "lucide-react";
import {
  type DocumentTemplate,
  type PageSizeInfo,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { boxesIntersect } from "./templateEditorUtils";
import { TemplateElementRenderer } from "./TemplateElementRenderer";


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
  printTokens?: never;
  onDeselect: () => void;
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string, handle?: "se" | "e" | "s") => void;
  onSelectElements?: (elementIds: string[]) => void;
  onDeleteElement: (elementId: string) => void;
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
  onDeselect,
  onMouseDownElement,
  onMouseDownResize,
  onSelectElements,
  onDeleteElement,
  sampleData,
  t,
}: TemplateEditorCanvasProps<TPayload>): React.JSX.Element {
  const [marquee, setMarquee] = React.useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const marqueeMovedRef = React.useRef(false);
  const isShiftRef = React.useRef(false);
  const marqueeRef = React.useRef(marquee);
  React.useEffect(() => { marqueeRef.current = marquee; }, [marquee]);

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

  const handleMarqueeMove = useEffectEvent((event: MouseEvent) => {
    const current = marqueeRef.current;
    if (!current) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = (event.clientX - rect.left) / canvasScale;
    const currentY = (event.clientY - rect.top) / canvasScale;
    if (Math.abs(currentX - current.startX) > 4 || Math.abs(currentY - current.startY) > 4) {
      marqueeMovedRef.current = true;
    }
    setMarquee((prev) => (prev ? { ...prev, currentX, currentY } : null));
  });

  const handleMarqueeUp = useEffectEvent(() => {
    const current = marqueeRef.current;
    if (current && marqueeMovedRef.current) {
      const box = {
        x: Math.min(current.startX, current.currentX),
        y: Math.min(current.startY, current.currentY),
        w: Math.abs(current.currentX - current.startX),
        h: Math.abs(current.currentY - current.startY),
      };
      const hitIds = template.elements
        .filter((el) => boxesIntersect(box, { x: el.x, y: el.y, w: el.w, h: el.h }))
        .map((el) => el.id);

      if (onSelectElements) {
        onSelectElements(isShiftRef.current ? Array.from(new Set([...selectedIds, ...hitIds])) : hitIds);
      }
    } else if (current) {
      onDeselect();
    }
    setMarquee(null);
  });

  React.useEffect(() => {
    if (!marquee) return;
    window.addEventListener("mousemove", handleMarqueeMove, { passive: true });
    window.addEventListener("mouseup", handleMarqueeUp);
    return () => {
      window.removeEventListener("mousemove", handleMarqueeMove);
      window.removeEventListener("mouseup", handleMarqueeUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marquee != null]);

  return (
    <main
      ref={canvasViewportRef as React.RefObject<HTMLDivElement>}
      tabIndex={-1}
      aria-label="Template Canvas Viewport"
      className="flex-1 bg-muted/30 overflow-auto p-6 flex flex-col items-center justify-start relative min-h-[300px] select-none focus:outline-none"
    >
      {/* Status pill */}
      <div className="mb-3 px-3 py-1 rounded-full bg-background/90 border border-border/70 text-3xs text-muted-foreground font-mono shadow-sm backdrop-blur-md flex items-center gap-2 ring-1 ring-black/[0.04]">
        <span className="font-semibold text-foreground/80">{size.label}</span>
        <span className="text-border">·</span>
        <span>{size.width} × {size.height} pt</span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground/90">{Math.round(canvasScale * 100)}%</span>
        {isPreviewMode && (
          <>
            <span className="text-border">·</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("templateEditor.previewMode")}
            </span>
          </>
        )}
      </div>

      <div
        ref={canvasRef}
        dir="ltr"
        onMouseDown={onMouseDownBackground}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${canvasScale})`,
          transformOrigin: "top center",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.16), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.08)",
        }}
        className="relative bg-white text-black select-none transition-shadow rounded-xs border border-border/40 flex-shrink-0"
      >
        {!isPreviewMode && showGuides && (
          <>
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div
              className="absolute inset-[24px] pointer-events-none border border-dashed border-sky-400/35 rounded-xs"
              title={t("templateEditor.safeMargins")}
            />
          </>
        )}

        {template.elements.length === 0 && !isPreviewMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-400 flex items-center justify-center">
                <LayoutTemplate className="w-7 h-7 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500 m-0">{t("templateEditor.emptyCanvasHint")}</p>
                <p className="text-2xs text-slate-400 mt-0.5 m-0">{t("templateEditor.emptyCanvasHintDetail")}</p>
              </div>
            </div>
          </div>
        )}

        {template.elements.map((el) => (
          <TemplateElementRenderer
            key={el.id}
            el={el}
            isSelected={!isPreviewMode && (selectedIds.includes(el.id) || selectedId === el.id)}
            isPreviewMode={isPreviewMode}
            branding={branding}
            sampleData={sampleData}
            onMouseDownElement={onMouseDownElement}
            onMouseDownResize={onMouseDownResize}
            onDeleteElement={onDeleteElement}
            t={t}
          />
        ))}

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
