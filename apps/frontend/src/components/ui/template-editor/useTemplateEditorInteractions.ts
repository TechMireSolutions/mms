/**
 * @file useTemplateEditorInteractions.ts
 * @description Drag, resize, and mouse interaction handling for the visual template canvas.
 * Uses React 19 useEffectEvent for stable handlers that always read current canvasScale
 * without causing listener re-subscription on every render.
 */

import { useEffect, useEffectEvent, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { DocumentTemplate, TemplateElement } from "@mms/shared";
import { snap } from "./templateEditorUtils";

export interface DragItem {
  id: string;
  origX: number;
  origY: number;
}

export interface DragStateInfo<TPayload = Record<string, unknown>> {
  items: DragItem[];
  startX: number;
  startY: number;
  initialTemplate: DocumentTemplate<TPayload>;
  hasMoved?: boolean;
}

export interface ResizeStateInfo<TPayload = Record<string, unknown>> {
  id: string;
  handle?: "se" | "e" | "s";
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  initialTemplate: DocumentTemplate<TPayload>;
  hasMoved?: boolean;
}

interface DragResizeRefs<TPayload = Record<string, unknown>> {
  dragState: RefObject<DragStateInfo<TPayload> | null>;
  resizeState: RefObject<ResizeStateInfo<TPayload> | null>;
  canvasViewportRef?: RefObject<HTMLElement | null>;
}

interface UseTemplateEditorInteractionsOptions<TPayload = Record<string, unknown>> extends DragResizeRefs<TPayload> {
  canvasScale: number;
  updateElements: (updateFn: (templateElements: TemplateElement<keyof TPayload & string>[]) => TemplateElement<keyof TPayload & string>[]) => void;
  setTemplate: Dispatch<SetStateAction<DocumentTemplate<TPayload>>>;
  setHistory: Dispatch<SetStateAction<DocumentTemplate<TPayload>[]>>;
  setFuture: Dispatch<SetStateAction<DocumentTemplate<TPayload>[]>>;
}

export function useTemplateEditorInteractions<TPayload = Record<string, unknown>>({
  canvasScale,
  dragState,
  resizeState,
  canvasViewportRef,
  updateElements,
  setHistory,
  setFuture,
}: UseTemplateEditorInteractionsOptions<TPayload>) {
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  const onMouseMove = useEffectEvent((event: MouseEvent) => {
    if (panState.current && canvasViewportRef?.current) {
      const dx = event.clientX - panState.current.startX;
      const dy = event.clientY - panState.current.startY;
      canvasViewportRef.current.scrollLeft = panState.current.scrollLeft - dx;
      canvasViewportRef.current.scrollTop = panState.current.scrollTop - dy;
      return;
    }

    const currentDrag = dragState.current;
    if (currentDrag) {
      currentDrag.hasMoved = true;
      const deltaX = (event.clientX - currentDrag.startX) / canvasScale;
      const deltaY = (event.clientY - currentDrag.startY) / canvasScale;
      const itemMap = new Map(currentDrag.items.map((item) => [item.id, item]));

      updateElements((templateElements) =>
        templateElements.map((templateElement) => {
          const orig = itemMap.get(templateElement.id);
          if (!orig) return templateElement;
          return {
            ...templateElement,
            x: snap(Math.max(0, orig.origX + deltaX)),
            y: snap(Math.max(0, orig.origY + deltaY)),
          };
        })
      );
    }

    const currentResize = resizeState.current;
    if (currentResize) {
      currentResize.hasMoved = true;
      const deltaX = (event.clientX - currentResize.startX) / canvasScale;
      const deltaY = (event.clientY - currentResize.startY) / canvasScale;
      const hType = currentResize.handle || "se";

      updateElements((templateElements) =>
        templateElements.map((templateElement) => {
          if (templateElement.id !== currentResize.id) return templateElement;
          const nextW =
            hType === "s"
              ? templateElement.w
              : snap(Math.max(20, currentResize.origW + deltaX));
          const nextH =
            hType === "e"
              ? templateElement.h
              : snap(Math.max(4, currentResize.origH + deltaY));
          return { ...templateElement, w: nextW, h: nextH };
        })
      );
    }
  });

  const onMouseUp = useEffectEvent(() => {
    panState.current = null;
    if (dragState.current?.hasMoved) {
      const initial = dragState.current.initialTemplate;
      setHistory((historyStack) => [...historyStack.slice(-30), initial]);
      setFuture([]);
    } else if (resizeState.current?.hasMoved) {
      const initial = resizeState.current.initialTemplate;
      setHistory((historyStack) => [...historyStack.slice(-30), initial]);
      setFuture([]);
    }
    dragState.current = null;
    resizeState.current = null;
  });

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
