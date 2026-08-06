import React, { useState, type ReactNode } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";

export interface OptionSelectPopoverProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** When set, each option shows a remove control that updates the options list. */
  onUpdateOptions?: (options: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  onOpenChange?: (open: boolean) => void;
  /** Rendered below the option list; `close` dismisses the popover. */
  footer?: (api: { close: () => void }) => ReactNode;
}

/** Shared option listbox popover used by EditableSelect (Contacts form option lists). */
export function OptionSelectPopover({
  options,
  value,
  onChange,
  onUpdateOptions,
  placeholder,
  className = "w-28",
  id,
  name,
  onOpenChange,
  footer,
}: OptionSelectPopoverProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("contacts.form.selectOption");
  const canRemoveOptions = Boolean(onUpdateOptions);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const fallbackId = React.useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  const listboxId = `${resolvedId}-listbox`;

  const handleOpenChange = (openState: boolean): void => {
    setOpen(openState);
    setHighlightedIndex(openState ? Math.max(0, options.indexOf(value)) : -1);
    onOpenChange?.(openState);
  };

  const handleRemove = (option: string, event: React.MouseEvent): void => {
    if (!onUpdateOptions) return;
    event.stopPropagation();
    const nextOptions = options.filter((availableOption) => availableOption !== option);
    onUpdateOptions(nextOptions);
    if (value === option) {
      onChange(nextOptions[0] || "");
    }
  };

  const select = (option: string): void => {
    onChange(option);
    setOpen(false);
  };

  const moveHighlight = (direction: 1 | -1): void => {
    if (options.length === 0) return;
    setHighlightedIndex((prevIndex) => {
      const start = prevIndex < 0 ? (direction === 1 ? -1 : 0) : prevIndex;
      return (start + direction + options.length) % options.length;
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        id={resolvedId}
        name={resolvedName}
        aria-label={resolvedPlaceholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={cn(
          "min-h-11 flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-start",
          className,
        )}
      >
        <span className="truncate">
          {formatContactOptionLabel(value, t) || resolvedPlaceholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[13rem] max-h-[var(--radix-popover-content-available-height)] flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl divide-y divide-border/60"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHighlight(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHighlight(-1);
          } else if (
            event.key === "Enter" &&
            (event.target as HTMLElement).tagName !== "INPUT"
          ) {
            const highlighted = options[highlightedIndex];
            if (highlighted === undefined) return;
            event.preventDefault();
            select(highlighted);
          }
        }}
      >
        <div id={listboxId} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          {options.map((option, index) => {
            const isSelected = value === option;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={option}
                id={`${resolvedId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => select(option)}
                className={`flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/5 text-primary font-semibold"
                    : isHighlighted
                      ? "bg-muted/70 text-foreground"
                      : "text-foreground"
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{formatContactOptionLabel(option, t)}</span>
                </span>
                {canRemoveOptions ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => handleRemove(option, event)}
                    className={`rounded transition-colors ${REMOVE_BTN}`}
                    aria-label={t("contacts.form.removeOption", { option })}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden />
                  </Button>
                ) : null}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">{t("contacts.form.noOptions")}</div>
          )}
        </div>
        {footer?.({ close: () => handleOpenChange(false) })}
      </PopoverContent>
    </Popover>
  );
}
