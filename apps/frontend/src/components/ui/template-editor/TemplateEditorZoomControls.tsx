/**
 * @file TemplateEditorZoomControls.tsx
 * @description Segmented zoom controls (zoom in, zoom out, reset to 100%, and fit to width).
 */

import React from "react";
import { ZoomIn, ZoomOut, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TemplateEditorZoomControlsProps {
  canvasScale?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset?: () => void;
  onZoomFit?: () => void;
}

export function TemplateEditorZoomControls({
  canvasScale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
}: TemplateEditorZoomControlsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5 ms-2 border border-border/80 bg-muted/40 rounded-lg p-0.5 shadow-2xs">
      <Button
        type="button"
        onClick={onZoomOut}
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 rounded hover:bg-background/80"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        onClick={onZoomReset}
        variant="ghost"
        className="min-h-11 px-2 text-[11px] font-mono font-medium hover:bg-background/80"
        title="Reset Zoom to 100%"
      >
        {canvasScale ? `${Math.round(canvasScale * 100)}%` : "100%"}
      </Button>
      <Button
        type="button"
        onClick={onZoomIn}
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 rounded hover:bg-background/80"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      {onZoomFit && (
        <Button
          type="button"
          onClick={onZoomFit}
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 rounded hover:bg-background/80"
          title="Fit to Width"
        >
          <Scan className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
