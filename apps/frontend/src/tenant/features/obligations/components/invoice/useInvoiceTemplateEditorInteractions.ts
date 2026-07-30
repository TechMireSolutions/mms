import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { InvoiceTemplate, TemplateElement } from "@/lib/invoiceTemplateStore";
import { snap } from "./invoiceTemplateEditorUtils";

interface DragResizeRefs {
  dragState: RefObject<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>;
  resizeState: RefObject<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>;
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
  setTemplate,
  setHistory,
  setFuture,
}: UseInvoiceTemplateEditorInteractionsOptions) {
  const onMouseMove = useCallback((event: MouseEvent) => {
    const currentDrag = dragState.current;
    if (currentDrag) {
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
      const deltaX = (event.clientX - currentResize.startX) / canvasScale;
      const deltaY = (event.clientY - currentResize.startY) / canvasScale;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === currentResize.id
          ? { ...templateElement, w: snap(Math.max(20, currentResize.origW + deltaX)), h: snap(Math.max(8, currentResize.origH + deltaY)) }
          : templateElement
        )
      );
    }
  }, [canvasScale, dragState, resizeState, updateElements]);

  const onMouseUp = useCallback(() => {
    if (dragState.current || resizeState.current) {
      setTemplate((currentTemplate) => {
        setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
        setFuture([]);
        return currentTemplate;
      });
    }
    dragState.current = null;
    resizeState.current = null;
  }, [dragState, resizeState, setFuture, setHistory, setTemplate]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);
}
