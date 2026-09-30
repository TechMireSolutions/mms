import React from "react";
import { AlignJustify } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type DensityMode = "compact" | "default" | "relaxed";

export interface DensityToggleProps {
  density: DensityMode;
  onChange: (d: DensityMode) => void;
  className?: string;
}

const MODES: { value: DensityMode; label: string; lines: number }[] = [
  { value: "compact",  label: "Compact",  lines: 3 },
  { value: "default",  label: "Default",  lines: 2 },
  { value: "relaxed",  label: "Relaxed",  lines: 1 },
];

/**
 * Row-density toggle — Compact / Default / Relaxed table row height.
 *
 * Works with the `[data-density]` CSS system in `index.css`.
 * Pass the result into `ModuleWorkToolbar.densityToggle`.
 *
 * @example
 * ```tsx
 * const [density, setDensity] = useState<DensityMode>("default");
 * <DensityToggle density={density} onChange={setDensity} />
 * ```
 */
export function DensityToggle({ density, onChange, className }: DensityToggleProps): React.JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label="Row density"
      className={cn("flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5", className)}
    >
      {MODES.map(({ value, label, lines }) => {
        const isSelected = density === value;
        return (
          <Tooltip key={value} delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${label} row density`}
                onClick={() => onChange(value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-[3px] w-8 h-8 rounded-md transition-all cursor-pointer min-h-8 min-w-8",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {/* Visual: stacked lines representing row density */}
                <AlignJustify
                  className={cn(
                    "transition-all",
                    value === "compact"  && "w-3.5 h-3.5",
                    value === "default"  && "w-3 h-3",
                    value === "relaxed"  && "w-2.5 h-2.5",
                  )}
                  strokeWidth={value === "compact" ? 2.5 : value === "relaxed" ? 1.5 : 2}
                  aria-hidden="true"
                />
                <span className="sr-only">{label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
