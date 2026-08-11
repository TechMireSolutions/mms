import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeTone =
  | "primary"
  | "success"
  | "destructive"
  | "warning"
  | "info"
  | "secondary"
  | "muted";

const BADGE_TONES: Record<BadgeTone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: SEMANTIC_BADGE.success,
  destructive: SEMANTIC_BADGE.destructive,
  warning: SEMANTIC_BADGE.warning,
  info: SEMANTIC_BADGE.info,
  secondary: SEMANTIC_BADGE.secondary,
  muted: SEMANTIC_BADGE.muted,
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Soft semantic tone — wins over `variant` when set. */
  tone?: BadgeTone;
  /** Rounded-full pill shape. */
  pill?: boolean;
  /** Render element — `span` for inline/table-cell pills. */
  as?: "div" | "span";
}

/**
 * Badge — SSOT for status/tag pills. Solid `variant` for filled chrome,
 * `tone` for soft semantic pills, `pill` for the rounded-full shape.
 */
function Badge({
  className,
  variant,
  tone,
  pill = false,
  as: Comp = "div",
  ...props
}: BadgeProps) {
  return (
    <Comp
      className={cn(
        badgeVariants({ variant }),
        tone && BADGE_TONES[tone],
        pill && "rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants }
