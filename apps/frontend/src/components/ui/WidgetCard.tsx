import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accentColor?: "primary" | "success" | "warning" | "destructive" | "info" | "emerald" | "indigo" | "rose" | "amber";
  children: React.ReactNode;
  ariaLabelledby?: string;
}

/**
 * WidgetCard is a design system primitive that wraps the Card component.
 * It provides interactive dashboard-specific styles (e.g. lift on hover) and color accent stripes.
 */
export const WidgetCard = React.forwardRef<HTMLDivElement, WidgetCardProps>(
  ({ className, accentColor, ariaLabelledby, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        accentColor={accentColor}
        className={cn(
          "hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left",
          accentColor === "destructive" && "border-destructive/30 hover:border-destructive/55",
          className
        )}
        aria-labelledby={ariaLabelledby}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

WidgetCard.displayName = "WidgetCard";
