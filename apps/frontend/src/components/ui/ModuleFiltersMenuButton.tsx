import { SlidersHorizontal, type LucideIcon } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_FILTER_ACTIVE,
  WORK_TOOLBAR_TRIGGER_FILTER_IDLE,
} from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface ModuleFiltersMenuTriggerProps extends ComponentPropsWithoutRef<"button"> {
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
      type = "button",
      ...rest
    },
    ref,
  ) {
    const isActive = activeCount > 0;

    return (
      <Button
        ref={ref}
        type={type}
        variant="ghost"
        className={cn(
          WORK_TOOLBAR_TRIGGER,
          isActive ? WORK_TOOLBAR_TRIGGER_FILTER_ACTIVE : WORK_TOOLBAR_TRIGGER_FILTER_IDLE,
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
