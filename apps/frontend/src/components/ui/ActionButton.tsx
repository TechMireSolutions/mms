import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const VARIANT_MAP = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
} as const;

const SIZES = {
  sm: "min-h-11 px-3 py-2 text-xs gap-1.5",
  md: "min-h-11 px-3.5 py-2.5 text-sm gap-1.5",
} as const;

/**
 * ActionButton — consistent CTA button used across all pages, composing the base Button primitive.
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    {
      variant = "secondary",
      size = "md",
      icon: Icon = null,
      loading = false,
      disabled = false,
      onClick = undefined,
      children = null,
      className = "",
      ...props
    },
    ref
  ) {
    return (
      <Button
        ref={ref}
        variant={VARIANT_MAP[variant] ?? "outline"}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "font-semibold rounded-lg shadow-sm",
          variant === "secondary" && "bg-card text-foreground border-border hover:bg-muted",
          variant === "danger" && "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 shadow-none",
          SIZES[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />
        ) : (
          Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {children}
      </Button>
    );
  }
);
ActionButton.displayName = "ActionButton";
