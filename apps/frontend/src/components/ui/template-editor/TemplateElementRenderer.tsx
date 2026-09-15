/**
 * @file TemplateElementRenderer.tsx
 * @description Interactive canvas element: position, selection chrome and keyboard
 * affordances wrapped around the shared {@link TemplateElementContent} renderer.
 */

import React from "react";
import type { DocumentTemplate } from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { CANVAS_ACCENT, interpolateTemplateTokens } from "./templateEditorUtils";
import { TemplateElementContent } from "./templateElementContent";
import { resolveElementGeometry } from "./templateDataResolution";
import type { ResizeHandle } from "./useTemplateEditorInteractions";

export interface TemplateElementRendererProps<TPayload = Record<string, unknown>> {
  el: DocumentTemplate<TPayload>["elements"][number];
  isSelected: boolean;
  isPreviewMode: boolean;
  branding: {
    logoUrl?: string | null;
  };
  sampleData?: TPayload;
  /** Whether this element is the single tab stop for the canvas (roving tabindex). */
  isFocusTarget?: boolean;
  /** Briefly true for a just-added element, so it can be highlighted. */
  isNew?: boolean;
  /** Application direction, used as the fallback writing direction for elements. */
  appDir?: "ltr" | "rtl";
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string, handle?: ResizeHandle) => void;
  onDeleteElement: (elementId: string) => void;
  onSelectElement?: (elementId: string) => void;
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

export const TemplateElementRenderer = React.memo(function TemplateElementRenderer<
  TPayload = Record<string, unknown>
>({
  el,
  isSelected,
  isPreviewMode,
  branding,
  sampleData,
  isFocusTarget = false,
  isNew = false,
  appDir = "ltr",
  onMouseDownElement,
  onMouseDownResize,
  onDeleteElement,
  onSelectElement,
  t,
}: TemplateElementRendererProps<TPayload>) {
  const [logoLoadFailed, setLogoLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoLoadFailed(false);
  }, [branding.logoUrl]);

  const st = el.style || {};
  const data = (sampleData as Record<string, unknown>) || null;
  const geometry = resolveElementGeometry(el, appDir);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isPreviewMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      /*
       * Select through the element-id callback, NOT by re-using the pointer handler:
       * `onMouseDownElement` bails on `event.button !== 0`, and a KeyboardEvent has no
       * `button` at all, so pressing Enter or Space on a focused element was a no-op and
       * nothing on the canvas could be selected, moved, or resized from the keyboard.
       */
      onSelectElement?.(el.id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      onDeleteElement(el.id);
    } else if (
      (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") &&
      !isSelected
    ) {
      // The first arrow press selects; later presses nudge through the global shortcut
      // hook, which only acts when something is selected.
      e.preventDefault();
      e.stopPropagation();
      onSelectElement?.(el.id);
    }
  };

  const elementAriaLabel = el.label
    ? `${el.label} (${el.type})`
    : `${t("templateEditor.element")} ${el.type}`;

  return (
    <div
      dir={geometry.direction}
      role={isPreviewMode ? undefined : "button"}
      tabIndex={isPreviewMode ? -1 : isFocusTarget ? 0 : -1}
      aria-label={elementAriaLabel}
      /*
       * `aria-pressed` is accurate rather than a misuse here: pointer clicks already
       * toggle membership in the selection (plain click selects, Ctrl/Shift+click adds
       * or removes), which is the toggle-button model.
       */
      aria-pressed={isPreviewMode ? undefined : isSelected}
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
        textAlign: geometry.textAlign,
        direction: geometry.direction,
        /*
         * The element keeps its *own* border while selected: the selection outline is a
         * separate overlay, so selection chrome never prints and the 1.5px selection
         * border no longer nudges the content on every click.
         */
        border: st.borderWidth
          ? `${st.borderWidth}px solid ${st.borderColor || "#cbd5e1"}`
          : "1px dashed transparent",
        borderRadius: st.borderRadius != null ? `${st.borderRadius}px` : undefined,
        backgroundColor: st.backgroundColor || "transparent",
        cursor: isPreviewMode ? "default" : "move",
      }}
      className={`group flex items-center overflow-visible px-1 focus-visible:outline-2 focus-visible:outline-ring ${
        !isPreviewMode && !isSelected ? "hover:border-primary/40" : ""
      } ${isNew ? "ring-2 ring-primary ring-offset-2 ring-offset-white" : ""}`}
    >
      <TemplateElementContent
        el={el}
        data={data}
        mode={isPreviewMode ? "preview" : "edit"}
        logoUrl={branding.logoUrl}
        logoFailed={logoLoadFailed}
        onLogoError={() => setLogoLoadFailed(true)}
        geometry={geometry}
        interpolate={interpolateTemplateTokens}
        t={t}
      />

      {isSelected && !isPreviewMode && (
        <>
          {/* Selection chrome — never printed. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none print:hidden"
            style={{
              border: `1.5px solid ${CANVAS_ACCENT.selection}`,
              backgroundColor: CANVAS_ACCENT.selectionSoft,
            }}
          />
          {RESIZE_HANDLES.map(({ handle, style, cursor }) => (
            <div
              key={handle}
              tabIndex={-1}
              aria-hidden="true"
              /* Pointer-only affordance: keyboard users resize with Alt+arrow keys or
                 the Width/Height fields in the inspector. */
              onMouseDown={(e) => onMouseDownResize(e, el.id, handle)}
              style={{ ...style, borderColor: CANVAS_ACCENT.selection }}
              className={`absolute w-3 h-3 rounded-xs bg-white border-2 shadow-xs z-elevated hover:scale-125 hover:brightness-95 transition-transform touch-none print:hidden ${cursor}`}
            />
          ))}
          <div
            style={{
              left: 0,
              top: el.y < 24 ? el.h + 4 : -22,
              backgroundColor: CANVAS_ACCENT.selectionStrong,
            }}
            aria-live="off"
            aria-hidden="true"
            className="absolute text-white font-mono text-3xs font-medium px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none z-sticky print:hidden"
          >
            {`${Math.round(el.w)} × ${Math.round(el.h)}`}
          </div>
        </>
      )}
    </div>
  );
}) as <TPayload>(props: TemplateElementRendererProps<TPayload>) => React.JSX.Element;
