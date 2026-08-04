import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type WarningCalloutDensity = "compact" | "banner";

export interface WarningCalloutProps {
  icon?: LucideIcon;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
  density?: WarningCalloutDensity;
  className?: string;
}

export function WarningCallout({
  icon: Icon = AlertTriangle,
  title,
  description,
  children,
  action,
  role = "status",
  density = "banner",
  className,
}: WarningCalloutProps): React.JSX.Element {
  const isCompact = density === "compact";

  return (
    <div
      role={role}
      className={cn(
        "flex gap-2 rounded-xl border border-warning/30 bg-warning/10",
        isCompact
          ? "items-start px-3 py-2.5 text-xs font-medium text-foreground"
          : "items-center px-4 py-3 text-sm text-warning",
        action ? "justify-between" : undefined,
        className,
      )}
    >
      <div className={cn("flex min-w-0 gap-2", isCompact ? "items-start" : "items-center")}>
        <Icon
          className={cn(
            "shrink-0 text-warning",
            isCompact ? "mt-0.5 h-3.5 w-3.5" : "h-4 w-4",
          )}
          aria-hidden
        />
        <div className="min-w-0">
          {title ? <p className="m-0 font-semibold">{title}</p> : null}
          {description ? (
            <p className={cn("m-0", title ? "text-warning/90" : undefined)}>{description}</p>
          ) : null}
          {children}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
