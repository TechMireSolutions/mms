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
}: SectionCardProps): React.ReactElement {
  const hasHeader = title || Icon || actions;

  return (
    <div className={cn(SURFACE.card, "overflow-hidden", className)}>
      {hasHeader && (
        <div className={cn("flex items-center justify-between px-5 py-3.5", SURFACE.mutedHeader)}>
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
      <div className={padding ? "px-5 py-4" : undefined}>{children}</div>
    </div>
  );
}
