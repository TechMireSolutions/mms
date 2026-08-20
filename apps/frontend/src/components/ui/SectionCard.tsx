import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CardTitleBar } from "@/components/ui/CardTitleBar";
import { CARD_STRIPE_INSET, KPI_TONE } from "@/lib/semanticTone";

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
        <CardTitleBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          inset={!!accentColor}
          className="rounded-t-2xl"
          icon={
            Icon &&
            (() => {
              const resolvedAccent = accentColor === "emerald" ? "success" : accentColor === "rose" ? "destructive" : accentColor === "amber" ? "warning" : accentColor === "indigo" ? "primary" : accentColor;
              const tone = KPI_TONE[resolvedAccent as keyof typeof KPI_TONE] || KPI_TONE.primary;
              return (
                <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", tone.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", tone.text)} />
                </div>
              );
            })()
          }
        />
      )}
      <div className={cn(padding ? "px-5 py-4" : undefined, accentColor && CARD_STRIPE_INSET)}>{children}</div>
    </Card>
  );
}

