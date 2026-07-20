import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { KPI_TONE } from "@/lib/semanticTone";

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
    <Card className={className} accentColor={accentColor}>
      {hasHeader && (
        <div className={cn("flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/20 rounded-t-2xl", accentColor && "ps-6.5")}>
          <div className="flex items-center gap-2.5">
            {Icon && (() => {
              const resolvedAccent = accentColor === "emerald" ? "success" : accentColor === "rose" ? "destructive" : accentColor === "amber" ? "warning" : accentColor === "indigo" ? "primary" : accentColor;
              const tone = KPI_TONE[resolvedAccent as keyof typeof KPI_TONE] || KPI_TONE.primary;
              return (
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg", tone.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", tone.text)} />
                </div>
              );
            })()}
            <div>
              {title && <h3 className="text-[13px] font-bold text-foreground">{title}</h3>}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padding ? "px-5 py-4" : undefined, accentColor && "ps-6.5")}>{children}</div>
    </Card>
  );
}

