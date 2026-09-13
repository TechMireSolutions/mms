/**
 * @file useTemplateEditorZoom.ts
 * @description Hook managing canvas scaling, auto-fit, pinch-to-zoom / Ctrl+wheel zooming, and reset.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageSizeInfo } from "@mms/shared";

export interface UseTemplateEditorZoomOptions {
  size: PageSizeInfo;
}

export function useTemplateEditorZoom({ size }: UseTemplateEditorZoomOptions) {
  const [autoScale, setAutoScale] = useState(1);
  const [customZoom, setCustomZoom] = useState<number | null>(null);
  const canvasViewportRef = useRef<HTMLElement>(null);

  const canvasScale = customZoom ?? autoScale;

  const zoomIn = useCallback(
    () => setCustomZoom((prev) => Math.min(2.5, Number(((prev ?? canvasScale) + 0.1).toFixed(2)))),
    [canvasScale]
  );

  const zoomOut = useCallback(
    () => setCustomZoom((prev) => Math.max(0.3, Number(((prev ?? canvasScale) - 0.1).toFixed(2)))),
    [canvasScale]
  );

  const zoomReset = useCallback(() => setCustomZoom(1), []);
  const zoomFit = useCallback(() => setCustomZoom(null), []);

  // Auto-scale on viewport resize
  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const updateCanvasScale = () => {
      const availableWidth = Math.max(0, viewport.clientWidth - 32);
      if (availableWidth > 0) setAutoScale(Math.min(1, availableWidth / size.width));
    };
    const observer = new ResizeObserver(updateCanvasScale);
    observer.observe(viewport);
    updateCanvasScale();
    return () => observer.disconnect();
  }, [size.width]);

  // Ctrl+Wheel / Meta+Wheel zoom on the canvas viewport
  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setCustomZoom((prev) => {
          const current = prev ?? autoScale;
          const next = Math.min(2.5, Math.max(0.3, Number((current + delta).toFixed(2))));
          return next;
        });
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [autoScale]);

  return {
    canvasScale,
    customZoom,
    autoScale,
    canvasViewportRef,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
  };
}
