/**
 * @file useTemplateEditorInteractions.ts
 * @description Drag, resize, and mouse interaction handling for the visual template canvas.
 */

import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
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
  updateElements,
  setHistory,
  setFuture,
}: UseTemplateEditorInteractionsOptions<TPayload>) {
  const onMouseMove = useCallback((event: MouseEvent) => {
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
      updateElements((templateElements) =>
        templateElements.map((templateElement) =>
          templateElement.id === currentResize.id
            ? { ...templateElement, w: snap(Math.max(20, currentResize.origW + deltaX)), h: snap(Math.max(4, currentResize.origH + deltaY)) }
            : templateElement
        )
      );
    }
  }, [canvasScale, dragState, resizeState, updateElements]);

  const onMouseUp = useCallback(() => {
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
  }, [dragState, resizeState, setFuture, setHistory]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);
}
