import React from "react";
import { cn } from "@/lib/utils";
import { SURFACE, CARD_STRIPE_COLORS } from "@/lib/semanticTone";

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

  return (
    <div className={cn(
      "relative group/card rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      {accentColor && (
        <div className={cn("absolute start-0 top-0 bottom-0 w-1 rounded-s-2xl transition-colors duration-300", CARD_STRIPE_COLORS[accentColor])} />
      )}
      {hasHeader && (
        <div className={cn("flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/20 rounded-t-2xl", accentColor && "ps-6.5")}>
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
      <div className={cn(padding ? "px-5 py-4" : undefined, accentColor && "ps-6.5")}>{children}</div>

    </div>
  );
}
