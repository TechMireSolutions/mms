import { useEffect, useEffectEvent, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from "react";
import type { DocumentTemplate, PageSizeInfo, TemplateElement } from "@mms/shared";
import { computeSmartGuides, snap, type SmartGuideLine } from "./templateEditorUtils";

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

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface ResizeStateInfo<TPayload = Record<string, unknown>> {
  id: string;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
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

export interface UseTemplateEditorInteractionsOptions<TPayload = Record<string, unknown>> extends DragResizeRefs<TPayload> {
  canvasScale: number;
  size: PageSizeInfo;
  templateElements: TemplateElement<keyof TPayload & string>[];
  updateElements: (updateFn: (templateElements: TemplateElement<keyof TPayload & string>[]) => TemplateElement<keyof TPayload & string>[]) => void;
  setHistory: Dispatch<SetStateAction<DocumentTemplate<TPayload>[]>>;
  setFuture: Dispatch<SetStateAction<DocumentTemplate<TPayload>[]>>;
}

export function useTemplateEditorInteractions<TPayload = Record<string, unknown>>({
  canvasScale,
  size,
  templateElements,
  dragState,
  resizeState,
  canvasViewportRef,
  updateElements,
  setHistory,
  setFuture,
}: UseTemplateEditorInteractionsOptions<TPayload>) {
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [activeGuides, setActiveGuides] = useState<SmartGuideLine[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      panState.current = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const onPointerDownViewport = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.button === 1 || isSpacePressed) && canvasViewportRef?.current) {
      event.preventDefault();
      panState.current = {
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: canvasViewportRef.current.scrollLeft,
        scrollTop: canvasViewportRef.current.scrollTop,
      };
      setIsPanning(true);
    }
  };

  const onPointerMove = useEffectEvent((event: PointerEvent) => {
    if (!panState.current && !dragState.current && !resizeState.current) {
      return;
    }

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

      if (currentDrag.items.length === 1) {
        const singleItem = currentDrag.items[0]!;
        const currentEl = templateElements.find((el) => el.id === singleItem.id);
        if (currentEl) {
          const otherBoxes = templateElements
            .filter((el) => el.id !== singleItem.id)
            .map((el) => ({ x: el.x, y: el.y, w: el.w, h: el.h }));
          const maxX = Math.max(0, size.width - currentEl.w);
          const maxY = Math.max(0, size.height - currentEl.h);
          const rawBox = {
            x: Math.min(maxX, Math.max(0, singleItem.origX + deltaX)),
            y: Math.min(maxY, Math.max(0, singleItem.origY + deltaY)),
            w: currentEl.w,
            h: currentEl.h,
          };
          const snapRes = computeSmartGuides(rawBox, otherBoxes, size.width, size.height);
          setActiveGuides(snapRes.guides);

          updateElements((els) =>
            els.map((el) => (el.id === singleItem.id ? { ...el, x: snapRes.x, y: snapRes.y } : el))
          );
          return;
        }
      }

      updateElements((els) =>
        els.map((templateElement) => {
          const orig = itemMap.get(templateElement.id);
          if (!orig) return templateElement;
          const maxX = Math.max(0, size.width - templateElement.w);
          const maxY = Math.max(0, size.height - templateElement.h);
          return {
            ...templateElement,
            x: snap(Math.min(maxX, Math.max(0, orig.origX + deltaX))),
            y: snap(Math.min(maxY, Math.max(0, orig.origY + deltaY))),
          };
        })
      );
      setActiveGuides([]);
    }

    const currentResize = resizeState.current;
    if (currentResize) {
      currentResize.hasMoved = true;
      const deltaX = (event.clientX - currentResize.startX) / canvasScale;
      const deltaY = (event.clientY - currentResize.startY) / canvasScale;
      const hType: ResizeHandle = currentResize.handle || "se";
      const isCorner = ["nw", "ne", "sw", "se"].includes(hType);
      const keepRatio = event.shiftKey && isCorner && currentResize.origH > 0;
      const ratio = currentResize.origW / currentResize.origH;

      updateElements((els) =>
        els.map((templateElement) => {
          if (templateElement.id !== currentResize.id) return templateElement;

          let newX = currentResize.origX;
          let newY = currentResize.origY;
          let newW = currentResize.origW;
          let newH = currentResize.origH;

          // Width & X adjustments
          if (hType === "e" || hType === "ne" || hType === "se") {
            const maxW = Math.max(20, size.width - currentResize.origX);
            newW = Math.min(maxW, Math.max(20, currentResize.origW + deltaX));
          } else if (hType === "w" || hType === "nw" || hType === "sw") {
            const maxW = currentResize.origX + currentResize.origW;
            newW = Math.min(maxW, Math.max(20, currentResize.origW - deltaX));
            newX = currentResize.origX + (currentResize.origW - newW);
          }

          // Height & Y adjustments
          if (hType === "s" || hType === "se" || hType === "sw") {
            const maxH = Math.max(4, size.height - currentResize.origY);
            newH = Math.min(maxH, Math.max(4, currentResize.origH + deltaY));
          } else if (hType === "n" || hType === "ne" || hType === "nw") {
            const maxH = currentResize.origY + currentResize.origH;
            newH = Math.min(maxH, Math.max(4, currentResize.origH - deltaY));
            newY = currentResize.origY + (currentResize.origH - newH);
          }

          if (keepRatio) {
            newH = Math.max(4, newW / ratio);
            if (hType === "ne" || hType === "nw") {
              newY = currentResize.origY + (currentResize.origH - newH);
            }
          }

          return {
            ...templateElement,
            x: snap(Math.max(0, newX)),
            y: snap(Math.max(0, newY)),
            w: snap(newW),
            h: snap(newH),
          };
        })
      );
    }
  });

  const onPointerUp = useEffectEvent(() => {
    panState.current = null;
    setIsPanning(false);
    setActiveGuides([]);
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
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isSpacePressed,
    isPanning,
    activeGuides,
    onPointerDownViewport,
  };
}
