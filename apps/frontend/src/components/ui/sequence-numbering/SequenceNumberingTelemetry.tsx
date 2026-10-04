import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

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
  telemetryLabel,
  counterLabel,
  rolloverLabel,
}: SequenceNumberingTelemetryProps): React.JSX.Element {
  const { t } = useTranslation();
  const title = telemetryLabel ?? t("common.sequenceNumbering.lastIssued");
  const counter = counterLabel ?? t("common.sequenceNumbering.counter");
  const rollover = rolloverLabel ?? t("common.sequenceNumbering.rolloverYear");

  return (
    <div className="flex min-h-11 flex-col justify-center rounded-lg border border-border/60 bg-muted/20 p-3">
      <span className="text-xs font-medium text-foreground">{title}</span>
      <dl className="mt-1.5 space-y-1 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{counter}</dt>
          <dd className="font-mono font-semibold text-foreground">{currentCounter}</dd>
        </div>
        {rolloverYear !== undefined ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{rollover}</dt>
            <dd className="font-mono font-semibold text-foreground">{rolloverYear}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
