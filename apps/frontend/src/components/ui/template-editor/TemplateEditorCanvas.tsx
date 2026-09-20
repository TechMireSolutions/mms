/**
 * @file TemplateEditorCanvas.tsx
 * @description Central interactive visual design surface with selection handles, marquee, drag-and-drop, and canvas empty state.
 */

import React from "react";
import {
  type DocumentTemplate,
  type PageSizeInfo,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { CANVAS_ACCENT, type SmartGuideLine } from "./templateEditorUtils";
import { useTemplateMarquee } from "./useTemplateMarquee";
import { TemplateElementRenderer } from "./TemplateElementRenderer";
import { TemplateEditorCanvasEmptyState } from "./TemplateEditorCanvasEmptyState";
import { TemplateEditorCanvasGuides } from "./TemplateEditorCanvasGuides";
import { TEMPLATE_PAGE_WRAPPER_ATTR } from "./useTemplateEditorZoom";
import type { ResizeHandle } from "./useTemplateEditorInteractions";

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
  onMouseDownResize: (event: React.MouseEvent, elementId: string, handle?: ResizeHandle) => void;
  onSelectElements?: (elementIds: string[]) => void;
  onDeleteElement: (elementId: string) => void;
  onSelectElement?: (elementId: string) => void;
  /** Id of a just-added element to reveal and highlight, if any. */
  flashElementId?: string | null;
  /** Application direction, used as the fallback writing direction for elements. */
  appDir?: "ltr" | "rtl";
  sampleData?: TPayload;
  activeGuides?: SmartGuideLine[];
  isSpacePressed?: boolean;
  isPanning?: boolean;
  onPointerDownViewport?: (event: React.PointerEvent<HTMLElement>) => void;
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
  onSelectElement,
  flashElementId = null,
  appDir = "ltr",
  sampleData,
  activeGuides = [],
  isSpacePressed = false,
  isPanning = false,
  onPointerDownViewport,
  t,
}: TemplateEditorCanvasProps<TPayload>): React.JSX.Element {
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  /*
   * Roving tabindex: exactly one element is a tab stop, so a 25-element preset does not
   * put 25 stops between the canvas and the inspector. Enter/Space/arrows select.
   */
  const focusTargetId = selectedId ?? template.elements[0]?.id ?? null;

  const { marquee, onPointerDownBackground } = useTemplateMarquee({
    canvasRef,
    canvasScale,
    size,
    elements: template.elements,
    selectedIds,
    isPreviewMode,
    isSpacePressed,
    onDeselect,
    onSelectElements,
  });

  /*
   * "Add" used to drop the new element wherever the stagger maths landed — on a shipped
   * preset that was around (36,36), underneath the logo — so adding appeared to do
   * nothing. Now the canvas scrolls the new element into view.
   */
  React.useEffect(() => {
    if (!flashElementId) return;
    const viewport = canvasViewportRef.current;
    const element = template.elements.find((el) => el.id === flashElementId);
    if (!viewport || !element) return;
    const targetLeft = (element.x + element.w / 2) * canvasScale;
    const targetTop = (element.y + element.h / 2) * canvasScale;
    viewport.scrollTo({
      left: Math.max(0, targetLeft + 24 - viewport.clientWidth / 2),
      top: Math.max(0, targetTop + 24 - viewport.clientHeight / 2),
      behavior: "smooth",
    });
  }, [flashElementId, canvasScale, canvasViewportRef, template.elements]);


  return (
    <section
      ref={canvasViewportRef as React.RefObject<HTMLElement>}
      /*
       * tabIndex={0} is load-bearing: this is an `overflow-auto` scroll region and in
       * preview mode it has no other focusable descendant, so a keyboard user could
       * not scroll the page at all (axe `scrollable-region-focusable`). It is not a
       * landmark role: `<main>` would create a second main landmark inside the page.
       */
      tabIndex={0}
      aria-label={t("templateEditor.canvasViewport")}
      onPointerDown={onPointerDownViewport}
      className={`flex-1 bg-muted/30 overflow-auto p-6 flex flex-col items-center justify-start relative min-h-80 select-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary print:p-0 print:m-0 print:bg-white print:overflow-visible ${
        isSpacePressed ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
    >
      {/* Status pill */}
      <div
        role="status"
        /* No aria-label here: it used to repeat the viewport region's name verbatim,
           so screen readers announced two identically-named elements. The pill's own
           text is the status content. */
        className="mb-3 px-3 py-1 rounded-full bg-background/90 border border-border/70 text-3xs text-muted-foreground font-mono shadow-sm backdrop-blur-md flex items-center gap-2 ring-1 ring-black/[0.04] print:hidden"
      >
        <span className="font-semibold text-foreground/80">{size.label}</span>
        <span className="text-border">·</span>
        {/* PAGE_SIZES are CSS pixels at 96dpi (A6 = 397px = 105mm), not typographic points. */}
        <span>{size.width} × {size.height} px</span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground/90">{Math.round(canvasScale * 100)}%</span>
        {isPreviewMode && (
          <>
            <span className="text-border">·</span>
            <span className="text-success font-bold uppercase tracking-wider text-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {t("templateEditor.previewMode")}
            </span>
          </>
        )}
      </div>

      {/*
       * The page is scaled with a transform, which does not affect layout — so the
       * wrapper carries the *scaled* box. Without it the canvas kept its full unscaled
       * footprint, leaving large dead space and scrollbars whenever the zoom was below
       * 100%. The inline size is undone for print (the `!` is Tailwind v4's important
       * modifier and is required to beat the inline style), because print resets the
       * transform on the page itself.
       */}
      <div
        {...{ [TEMPLATE_PAGE_WRAPPER_ATTR]: "" }}
        className="shrink-0 print:w-auto! print:h-auto!"
        style={{ width: size.width * canvasScale, height: size.height * canvasScale }}
      >
        <div
          ref={canvasRef}
          dir="ltr"
          onPointerDown={onPointerDownBackground}
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${canvasScale})`,
            transformOrigin: "top left",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.16), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          }}
          className={`relative bg-white text-black select-none transition-shadow rounded-xs border border-border/40 shrink-0 print:border-none print:shadow-none print:m-0 print:transform-none ${
            isSpacePressed ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
        >
          {!isPreviewMode && showGuides && (
            <div className="print:hidden" aria-hidden="true">
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `radial-gradient(${CANVAS_ACCENT.grid} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
              <div
                className="absolute inset-[24px] pointer-events-none border border-dashed border-info/35 rounded-xs"
                title={t("templateEditor.safeMargins")}
              />
            </div>
          )}

          {!isPreviewMode && <TemplateEditorCanvasGuides activeGuides={activeGuides} />}

          {template.elements.length === 0 && (
            <TemplateEditorCanvasEmptyState isPreviewMode={isPreviewMode} t={t} />
          )}

          {template.elements.map((el) => (
            <TemplateElementRenderer
              key={el.id}
              el={el}
              isSelected={!isPreviewMode && (selectedSet.has(el.id) || selectedId === el.id)}
              isPreviewMode={isPreviewMode}
              isFocusTarget={focusTargetId === el.id}
              isNew={flashElementId === el.id}
              appDir={appDir}
              branding={branding}
              sampleData={sampleData}
              onMouseDownElement={onMouseDownElement}
              onMouseDownResize={onMouseDownResize}
              onDeleteElement={onDeleteElement}
              onSelectElement={onSelectElement}
              t={t}
            />
          ))}

          {!isPreviewMode && marquee && (
            <div
              aria-hidden="true"
              className="print:hidden"
              style={{
                position: "absolute",
                left: Math.min(marquee.startX, marquee.currentX),
                top: Math.min(marquee.startY, marquee.currentY),
                width: Math.abs(marquee.currentX - marquee.startX),
                height: Math.abs(marquee.currentY - marquee.startY),
                backgroundColor: CANVAS_ACCENT.marqueeSoft,
                border: `1px dashed ${CANVAS_ACCENT.selection}`,
                borderRadius: "2px",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
