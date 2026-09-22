import React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FacultyIdLivePreviewProps {
  livePreview: string;
  formulaTemplate: string;
  previewLabel: string;
  templateLabel: string;
}

/**
 * Modern Live Preview banner for deterministic Employee ID configuration.
 * Displays real-time formatted ID alongside the dynamic format token formula.
 */
export function FacultyIdLivePreview({
  livePreview,
  formulaTemplate,
  previewLabel,
  templateLabel,
}: FacultyIdLivePreviewProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-start shadow-2xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-foreground">
            {previewLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{templateLabel}:</span>
          <span className="px-2 py-0.5 rounded-md bg-background/80 border border-primary/20 text-foreground font-semibold">
            {formulaTemplate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="default"
          className="font-mono text-base px-3.5 py-1.5 font-bold tracking-widest bg-primary text-primary-foreground shadow-xs"
        >
          {livePreview}
        </Badge>
      </div>
    </div>
  );
}
