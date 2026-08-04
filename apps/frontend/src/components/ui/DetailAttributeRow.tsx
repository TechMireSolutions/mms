import type { ComponentType, ReactNode } from "react";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export type DetailAttributeRowVariant = "card" | "list";

export interface DetailAttributeRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  variant?: DetailAttributeRowVariant;
  className?: string;
}

/**
 * Presentational attribute row for person-directory detail drawers.
 * `card` = glass tile with accent bar (Students); `list` = border-b row (Teachers).
 */
export function DetailAttributeRow({
  icon: Icon,
  label,
  value,
  variant = "card",
  className,
}: DetailAttributeRowProps): React.JSX.Element {
  if (variant === "list") {
    return (
      <div className={cn("flex items-start gap-3 border-b border-border/40 py-3 last:border-b-0", className)}>
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `relative overflow-hidden group/row flex items-center gap-3 p-3 ${WORK_SURFACE_INNER} hover:shadow-md transition-all duration-200`,
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute start-0 top-0 bottom-0 w-1 bg-primary/40 group-hover/row:bg-primary transition-colors"
      />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}
