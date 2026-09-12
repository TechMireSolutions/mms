import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { InvoiceTemplate, TemplateElement } from "@/lib/invoiceTemplateStore";
import { snap } from "./invoiceTemplateEditorUtils";

export interface DragStateInfo {
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  initialTemplate: InvoiceTemplate;
  hasMoved?: boolean;
}

export interface ResizeStateInfo {
  id: string;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  initialTemplate: InvoiceTemplate;
  hasMoved?: boolean;
}

interface DragResizeRefs {
  dragState: RefObject<DragStateInfo | null>;
  resizeState: RefObject<ResizeStateInfo | null>;
}

interface UseInvoiceTemplateEditorInteractionsOptions extends DragResizeRefs {
  canvasScale: number;
  updateElements: (updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => void;
  setTemplate: Dispatch<SetStateAction<InvoiceTemplate>>;
  setHistory: Dispatch<SetStateAction<InvoiceTemplate[]>>;
  setFuture: Dispatch<SetStateAction<InvoiceTemplate[]>>;
}

export function useInvoiceTemplateEditorInteractions({
  canvasScale,
  dragState,
  resizeState,
  updateElements,
  setHistory,
  setFuture,
}: UseInvoiceTemplateEditorInteractionsOptions) {
  const onMouseMove = useCallback((event: MouseEvent) => {
    const currentDrag = dragState.current;
    if (currentDrag) {
      currentDrag.hasMoved = true;
      const deltaX = (event.clientX - currentDrag.startX) / canvasScale;
      const deltaY = (event.clientY - currentDrag.startY) / canvasScale;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === currentDrag.id
          ? { ...templateElement, x: snap(Math.max(0, currentDrag.origX + deltaX)), y: snap(Math.max(0, currentDrag.origY + deltaY)) }
          : templateElement
        )
      );
    }

    const currentResize = resizeState.current;
    if (currentResize) {
      currentResize.hasMoved = true;
      const deltaX = (event.clientX - currentResize.startX) / canvasScale;
      const deltaY = (event.clientY - currentResize.startY) / canvasScale;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === currentResize.id
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
