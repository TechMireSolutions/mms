import React, { useId, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FORM_INPUT_COMPACT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";

export interface EditableMultiSelectProps {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  onUpdateOptions?: (options: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  addPlaceholder?: string;
}

const INPUT_CLASS = cn("h-auto min-w-0 flex-1", FORM_INPUT_COMPACT);

export function EditableMultiSelect({
  options,
  values = [],
  onChange,
  onUpdateOptions,
  placeholder,
  className = "w-full",
  id,
  name,
  addPlaceholder,
}: EditableMultiSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const isAdding = false;

  const fallbackId = useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  const listboxId = `${resolvedId}-multi-listbox`;
  const resolvedPlaceholder = placeholder ?? t("contacts.form.selectOption");
  const addInputLabel = addPlaceholder ?? t("contacts.form.addNewTypePlaceholder");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const canAdd = Boolean(onUpdateOptions);

  const toggleOption = (option: string): void => {
    const isSelected = values.some(
      (v) => v.trim().toLowerCase() === option.trim().toLowerCase(),
    );
    if (isSelected) {
      onChange(values.filter((v) => v.trim().toLowerCase() !== option.trim().toLowerCase()));
    } else {
      onChange([...values, option]);
    }
  };

  const removeValue = (valToRemove: string, event: React.MouseEvent): void => {
    event.stopPropagation();
    onChange(values.filter((v) => v !== valToRemove));
    triggerRef.current?.focus();
  };

  const getBadgeTone = (val: string): "primary" | "success" | "warning" | "info" | "secondary" => {
    const ACCENT_COLORS = ["info", "warning", "success", "primary", "secondary"] as const;
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ACCENT_COLORS.length;
    return ACCENT_COLORS[index];
  };

  const handleAdd = (): void => {
    if (!canAdd || isAdding || !onUpdateOptions) return;
    const rawText = newTagValue.trim();
    if (!rawText) return;

    // Normalize: Capitalize first letter of each word
    const text = rawText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const existingInOptions = options.find(
      (opt) => opt.trim().toLowerCase() === text.toLowerCase(),
    );
    const existingInValues = values.some(
      (val) => val.trim().toLowerCase() === text.toLowerCase(),
    );

    if (!existingInOptions) {
      onUpdateOptions([...options, text]);
    }
    if (!existingInValues) {
      onChange([...values, existingInOptions || text]);
    }
    setNewTagValue("");
  };

  const filteredOptions = options
    .filter((opt) => opt.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearchQuery("");
          setNewTagValue("");
        }
      }}
    >
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        id={resolvedId}
        name={resolvedName}
        aria-label={resolvedPlaceholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={cn(
          "min-h-11 w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-start cursor-pointer",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {values.length === 0 ? (
            <span className="text-muted-foreground select-none">{resolvedPlaceholder}</span>
          ) : (
            values.map((val) => {
              const tone = getBadgeTone(val);
              return (
                <Badge
                  key={val}
                  pill
                  tone={tone}
                  className="gap-1 px-2 py-0.5 text-xs font-medium"
                >
                  <span>{formatContactOptionLabel(val, t) || val}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeValue(val, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeValue(val, e as unknown as React.MouseEvent);
                      }
                    }}
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    aria-label={t("contacts.form.removeTag", { tag: val })}
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </Badge>
              );
            })
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-64 max-h-80 flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl divide-y divide-border/60"
      >
        {options.length > 4 && (
          <div className="p-2 flex items-center gap-2 bg-muted/20">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 shadow-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 max-h-48"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
              {t("common.none")}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = values.some(
                (v) => v.trim().toLowerCase() === option.trim().toLowerCase(),
              );
              return (
                <div
                  key={option}
                  id={`${resolvedId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex min-h-9 items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors select-none",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="truncate">
                    {formatContactOptionLabel(option, t) || option}
                  </span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background",
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canAdd && (
          <div className="p-2 space-y-1.5 bg-muted/20 flex-shrink-0">
            <div className="flex gap-1.5">
              <Input
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAdd();
                  }
                }}
                placeholder={addInputLabel}
                aria-label={addInputLabel}
                disabled={isAdding}
                className={INPUT_CLASS}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={isAdding || !newTagValue.trim()}
                className="px-2.5 text-xs font-semibold rounded-lg flex-shrink-0 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("common.add")}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
