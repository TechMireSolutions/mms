import React, { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { RotateCcw, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_FILTER_ACTIVE,
  WORK_TOOLBAR_TRIGGER_FILTER_IDLE,
} from "@/components/ui/formStyles";
import { Badge } from "@/components/ui/badge";
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
export const ModuleFiltersMenuTrigger = React.memo(
  forwardRef<HTMLButtonElement, ModuleFiltersMenuTriggerProps>(
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
            <Badge pill className="w-4 h-4 px-0 font-bold">
              {activeCount}
            </Badge>
          ) : null}
          {children}
        </Button>
      );
    },
  ),
);

export interface ModuleFilterDropdownProps {
  /** Localized label shown on the trigger button. */
  label: string;
  /** Number of active filters; renders the count badge + active styling. */
  activeCount: number;
  icon?: LucideIcon;
  /** Localized clear-all label. When set and activeCount > 0, renders a clear-all item. */
  clearLabel?: string;
  onClear?: () => void;
  /** Labeled dropdown body groups (checkbox / radio) composed by callers. */
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Shared filter-dropdown shell: consistent trigger + content chrome for module Work
 * filter menus (Contacts / Students / Teachers / Messaging). Compose checkbox/radio
 * groups via {@link ModuleFilterCheckboxGroup} / {@link ModuleFilterRadioGroup}.
 */
export const ModuleFilterDropdown = React.memo(function ModuleFilterDropdown({
  label,
  activeCount,
  icon,
  clearLabel,
  onClear,
  children,
  contentClassName,
}: ModuleFilterDropdownProps): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ModuleFiltersMenuTrigger label={label} activeCount={activeCount} icon={icon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn("w-56 bg-card border border-border", contentClassName)}
      >
        {activeCount > 0 && clearLabel && onClear ? (
          <>
            <DropdownMenuItem
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
            >
              <span>{clearLabel}</span>
              <RotateCcw className="w-3 h-3 ms-1" />
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
          </>
        ) : null}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export interface ModuleFilterCheckboxOption {
  value: string;
  label: string;
}

export interface ModuleFilterCheckboxGroupProps {
  label: string;
  options: ModuleFilterCheckboxOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Labeled multi-select checkbox group for a filter dropdown. */
export const ModuleFilterCheckboxGroup = React.memo(function ModuleFilterCheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: ModuleFilterCheckboxGroupProps): React.JSX.Element {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-foreground">{label}</DropdownMenuLabel>
      {options.map((option) => (
        <DropdownMenuCheckboxItem
          key={option.value}
          checked={selected.includes(option.value)}
          onCheckedChange={() => onToggle(option.value)}
        >
          {option.label}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
});

export interface ModuleFilterRadioOption {
  value: string;
  label: ReactNode;
}

export interface ModuleFilterRadioGroupProps {
  label: string;
  options: ModuleFilterRadioOption[];
  value: string;
  onValueChange: (value: string) => void;
}

/** Labeled single-select radio group for a filter dropdown. */
export const ModuleFilterRadioGroup = React.memo(function ModuleFilterRadioGroup({
  label,
  options,
  value,
  onValueChange,
}: ModuleFilterRadioGroupProps): React.JSX.Element {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-foreground">{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
});

export interface ModuleFilterDividerProps {
  className?: string;
}

/** Vertical divider between groups within a filter dropdown. */
export const ModuleFilterDivider = React.memo(function ModuleFilterDivider({ className }: ModuleFilterDividerProps): React.JSX.Element {
  return <DropdownMenuSeparator className={cn("bg-border", className)} />;
});

