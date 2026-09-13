/**
 * @file TemplateEditorZoomControls.tsx
 * @description Segmented zoom controls (zoom in, zoom out, reset to 100%, and fit to width).
 */

import React from "react";
import { ZoomIn, ZoomOut, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorZoomControlsProps {
  canvasScale?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset?: () => void;
  onZoomFit?: () => void;
  t: TranslationFunction;
}

export function TemplateEditorZoomControls({
  canvasScale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  t,
}: TemplateEditorZoomControlsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5 ms-2 border border-border/80 bg-muted/40 rounded-lg p-0.5 shadow-2xs">
      <Button
        type="button"
        onClick={onZoomOut}
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 rounded hover:bg-background/80"
        title={t("templateEditor.zoomOut")}
        aria-label={t("templateEditor.zoomOut")}
      >
        <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        onClick={onZoomReset}
        variant="ghost"
        className="min-h-11 px-2 text-3xs font-mono font-medium hover:bg-background/80"
        title={t("templateEditor.zoomReset")}
        aria-label={t("templateEditor.zoomReset")}
      >
        {canvasScale ? `${Math.round(canvasScale * 100)}%` : "100%"}
      </Button>
      <Button
        type="button"
        onClick={onZoomIn}
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 rounded hover:bg-background/80"
        title={t("templateEditor.zoomIn")}
        aria-label={t("templateEditor.zoomIn")}
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
          title={t("templateEditor.zoomFit")}
          aria-label={t("templateEditor.zoomFit")}
        >
          <Scan className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
