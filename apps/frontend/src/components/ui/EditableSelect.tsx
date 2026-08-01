import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";

interface EditableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** When omitted, options are read-only for setup-only editing. */
  onUpdateOptions?: (options: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

const formatOptionLabel = (option: string, t: TranslationFunction): string =>
  formatContactOptionLabel(option, t);

export function EditableSelect({
  options,
  value,
  onChange,
  onUpdateOptions,
  placeholder,
  className = "w-28",
  id,
  name,
}: EditableSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("contacts.form.selectOption");
  const canEditOptions = Boolean(onUpdateOptions);
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const customInputId = React.useId();
  const fallbackId = React.useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;

  const listboxId = `${resolvedId}-listbox`;

  const handleAdd = (): void => {
    if (!onUpdateOptions) return;
    const text = customValue.trim();
    if (!text) return;
    const existing = options.find((opt) => opt.trim().toLowerCase() === text.toLowerCase());
    if (existing) {
      onChange(existing);
      setOpen(false);
      setCustomValue("");
    } else {
      const nextOptions = [...options, text];
      onUpdateOptions(nextOptions);
      onChange(text);
      setOpen(false);
      setCustomValue("");
    }
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
    <Popover
      open={open}
      onOpenChange={(openState) => {
        setOpen(openState);
        setHighlightedIndex(openState ? Math.max(0, options.indexOf(value)) : -1);
      }}
    >
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
          className
        )}
      >
        <span className="truncate">{formatOptionLabel(value, t) || resolvedPlaceholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
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
          } else if (event.key === "Enter" && highlightedIndex >= 0 && (event.target as HTMLElement).tagName !== "INPUT") {
            event.preventDefault();
            select(options[highlightedIndex]);
          }
        }}
      >
        <div id={listboxId} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          {options.map((option, index) => {
            const isSelected = value === option;
            const isHighlighted = index === highlightedIndex;
            const optionId = `${resolvedId}-opt-${index}`;
            return (
              <div
                key={option}
                id={optionId}
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
                  <span className="truncate">{formatOptionLabel(option, t)}</span>
                </span>
                {canEditOptions ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => handleRemove(option, event)}
                    className={`rounded transition-colors ${REMOVE_BTN}`}
                    title={t("contacts.form.removeOption", { option })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                ) : null}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">{t("contacts.form.noOptions")}</div>
          )}
        </div>
        {canEditOptions ? (
          <div className="p-2 flex gap-1.5 bg-muted/20 flex-shrink-0">
            <Input
              id={customInputId}
              name={customInputId}
              type="text"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAdd();
                }
              }}
              placeholder={t("contacts.form.addNewTypePlaceholder")}
              className="h-auto min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="px-2.5 text-xs font-semibold rounded-lg flex-shrink-0"
            >
              {t("common.add")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
