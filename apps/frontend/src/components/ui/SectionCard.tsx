import React from "react";
import { cn } from "@/lib/utils";
import { SURFACE } from "@/lib/semanticTone";

export interface SectionCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  padding?: boolean;
  className?: string;
  children: React.ReactNode;
  accentColor?: "primary" | "success" | "warning" | "destructive" | "info" | "emerald" | "indigo" | "rose" | "amber";
}

/** Section card — semantic tokens + `cn()` for class merging. */
export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  padding = true,
  className,
  children,
  accentColor,
}: SectionCardProps): React.ReactElement {
  const hasHeader = title || Icon || actions;

  const stripeColors = {
    primary: "bg-primary/45 group-hover/card:bg-primary",
    success: "bg-success/45 group-hover/card:bg-success",
    warning: "bg-warning/45 group-hover/card:bg-warning",
    destructive: "bg-destructive/45 group-hover/card:bg-destructive",
    info: "bg-info/45 group-hover/card:bg-info",
    emerald: "bg-emerald-500/45 group-hover/card:bg-emerald-500",
    indigo: "bg-indigo-500/45 group-hover/card:bg-indigo-500",
    rose: "bg-rose-500/45 group-hover/card:bg-rose-500",
    amber: "bg-amber-500/45 group-hover/card:bg-amber-500",
  }

  return (
    <div className={cn(
      "relative group/card rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      {accentColor && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300", stripeColors[accentColor])} />
      )}
      {hasHeader && (
        <div className={cn("flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/20 rounded-t-2xl", accentColor && "pl-6.5")}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div>
              {title && <h3 className="text-[13px] font-bold text-foreground">{title}</h3>}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padding ? "px-5 py-4" : undefined, accentColor && "pl-6.5")}>{children}</div>
    </div>
  );
}
