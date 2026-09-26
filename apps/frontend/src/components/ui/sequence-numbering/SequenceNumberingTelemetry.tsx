import React from "react";

export interface SequenceNumberingTelemetryProps {
  currentCounter?: number;
  rolloverYear?: number;
  telemetryLabel?: string;
  counterLabel?: string;
  rolloverLabel?: string;
}

export function SequenceNumberingTelemetry({
  currentCounter = 0,
  rolloverYear,
  telemetryLabel = "Sequence Telemetry",
  counterLabel = "Current Counter",
  rolloverLabel = "Rollover Year",
}: SequenceNumberingTelemetryProps): React.JSX.Element {
  return (
    <div className="flex flex-col justify-center p-3 rounded-lg border border-border/60 bg-muted/25 space-y-1">
      <span className="text-xs font-medium text-foreground">{telemetryLabel}</span>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
          <span className="text-muted-foreground">{counterLabel}:</span>
          <span className="font-mono font-semibold text-foreground">{currentCounter}</span>
        </span>
        {rolloverYear !== undefined && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
            <span className="text-muted-foreground">{rolloverLabel}:</span>
            <span className="font-mono font-semibold text-foreground">{rolloverYear}</span>
          </span>
        )}
      </div>
    </div>
  );
}
