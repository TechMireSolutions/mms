import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WakalaStepProgressBarProps {
  step: 1 | 2 | 3;
  onSetStep: (step: 1 | 2 | 3) => void;
  validateStep1: () => boolean;
  validateStep2: () => boolean;
}

export function WakalaStepProgressBar({
  step,
  onSetStep,
  validateStep1,
  validateStep2,
}: WakalaStepProgressBarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-1 rounded-xl bg-muted/40 p-2 text-xs font-semibold text-muted-foreground border border-border/50">
      <button
        type="button"
        onClick={() => onSetStep(1)}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
          step === 1
            ? "bg-primary text-primary-foreground shadow-sm"
            : step > 1
            ? "text-foreground hover:bg-muted"
            : "opacity-60",
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
          {step > 1 ? <Check className="h-3 w-3" /> : "1"}
        </span>
        <span>1. Mujtahid & Type</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (validateStep1()) onSetStep(2);
        }}
        disabled={step < 2 && !validateStep1}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
          step === 2
            ? "bg-primary text-primary-foreground shadow-sm"
            : step > 2
            ? "text-foreground hover:bg-muted"
            : "opacity-60",
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
          {step > 2 ? <Check className="h-3 w-3" /> : "2"}
        </span>
        <span>2. Representative</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (validateStep1() && validateStep2()) onSetStep(3);
        }}
        disabled={step < 3}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors",
          step === 3
            ? "bg-primary text-primary-foreground shadow-sm"
            : "opacity-60",
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
          3
        </span>
        <span>3. Distribution</span>
      </button>
    </div>
  );
}
