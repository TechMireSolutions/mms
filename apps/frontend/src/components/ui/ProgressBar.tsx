import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgressBarSize = "sm" | "md";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100 fill percentage. */
  value: number;
  /** Track height — `sm` (h-1.5) | `md` (h-2). */
  size?: ProgressBarSize;
  /** Fill `bg-*` class (e.g. from `rateToneClass` / `utilisationColour`). */
  fillClassName?: string;
  /** Inline fill styles — for dynamic palette `background` colors. */
  fillStyle?: CSSProperties;
  /** Trailing label after the track (e.g. `75%` or a count). */
  label?: ReactNode;
  /** Label className (tone / width / tabular-nums). */
  labelClassName?: string;
  /** Animate width via framer-motion (dispatch progress). */
  animated?: boolean;
  /** framer-motion transition override when `animated` (defaults to 0.2s ease). */
  transition?: Transition;
  /** Track overrides (e.g. `w-16`, `bg-border`, `shadow-inner`). */
  trackClassName?: string;
}

/**
 * Progress / rate bar — SSOT for the
 * `h-1.5|h-2 rounded-full bg-muted` track + `h-full rounded-full bg-*` fill
 * chrome (dashboard widgets / reports / attendance / accounting). Fill tone is
 * passed in via `fillClassName` (from `rateToneClass`, `utilisationColour`, …).
 */
export function ProgressBar({
  value,
  size = "sm",
  fillClassName = "bg-primary",
  fillStyle,
  label,
  labelClassName,
  animated = false,
  transition,
  trackClassName,
  className,
  ...props
}: ProgressBarProps): React.JSX.Element {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted flex-1",
          size === "md" ? "h-2" : "h-1.5",
          trackClassName,
        )}
      >
        {animated ? (
          <motion.div
            className={cn("h-full rounded-full", fillClassName)}
            style={fillStyle}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={transition ?? { duration: 0.2 }}
          />
        ) : (
          <div
            className={cn("h-full rounded-full transition-all", fillClassName)}
            style={{ width: `${pct}%`, ...fillStyle }}
          />
        )}
      </div>
      {label != null && <span className={cn("text-xs font-bold", labelClassName)}>{label}</span>}
    </div>
  );
}
