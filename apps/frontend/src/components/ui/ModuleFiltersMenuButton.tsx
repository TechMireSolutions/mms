import { SlidersHorizontal, type LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModuleFiltersMenuTriggerProps {
  label: string;
  activeCount?: number;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

/**
 * Shared Filters menu trigger (badge + active styles). Use as DropdownMenuTrigger child via asChild.
 */
export const ModuleFiltersMenuTrigger = forwardRef<HTMLButtonElement, ModuleFiltersMenuTriggerProps>(
  function ModuleFiltersMenuTrigger(
    {
      label,
      activeCount = 0,
      icon: Icon = SlidersHorizontal,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const isActive = activeCount > 0;

    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        className={cn(
          "flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted",
          isActive
            ? "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5"
            : "border-border bg-card text-foreground",
          className,
        )}
        {...rest}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{label}</span>
        {isActive ? (
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {activeCount}
          </span>
        ) : null}
        {children}
      </Button>
    );
  },
);
