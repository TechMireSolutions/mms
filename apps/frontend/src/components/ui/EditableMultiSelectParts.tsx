import React from "react";
import { Check, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { cn } from "@/lib/utils";
import { isOptionSelected } from "@/components/ui/editableMultiSelectUtils";

interface EditableMultiSelectChipRowProps {
  values: string[];
  placeholder: string;
  t: TranslationFunction;
  onRemoveValue: (valToRemove: string, event: React.MouseEvent) => void;
}

export function EditableMultiSelectChipRow({
  values,
  placeholder,
  t,
  onRemoveValue,
}: EditableMultiSelectChipRowProps): React.JSX.Element {
  if (values.length === 0) {
    return <span className="text-muted-foreground select-none">{placeholder}</span>;
  }

  return (
    <>
      {values.map((val) => (
        <Badge key={val} tone="primary" className="gap-1 px-2 py-0.5 text-xs font-medium">
          <span>{formatContactOptionLabel(val, t) || val}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => onRemoveValue(val, e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRemoveValue(val, e as unknown as React.MouseEvent);
              }
            }}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20 text-primary hover:text-destructive transition-colors cursor-pointer"
            aria-label={t("contacts.form.removeTag", { tag: val })}
          >
            <X className="w-3 h-3" />
          </span>
        </Badge>
      ))}
    </>
  );
}

interface EditableMultiSelectSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  t: TranslationFunction;
}

export function EditableMultiSelectSearchBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  t,
}: EditableMultiSelectSearchBarProps): React.JSX.Element {
  return (
    <div className="p-2 flex items-center gap-2 bg-muted/20">
      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("common.search")}
        className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 shadow-none"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={onClearSearch}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label={t("common.clearSearch")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

interface EditableMultiSelectOptionListProps {
  resolvedId: string;
  listboxId: string;
  filteredOptions: string[];
  values: string[];
  canRemoveOptions: boolean;
  t: TranslationFunction;
  onToggleOption: (option: string) => void;
  onRemoveOption: (option: string, event: React.MouseEvent) => void;
}

export function EditableMultiSelectOptionList({
  resolvedId,
  listboxId,
  filteredOptions,
  values,
  canRemoveOptions,
  t,
  onToggleOption,
  onRemoveOption,
}: EditableMultiSelectOptionListProps): React.JSX.Element {
  return (
    <div
      id={listboxId}
      role="listbox"
      aria-multiselectable="true"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 max-h-48"
    >
      {filteredOptions.length === 0 ? (
        <div className="px-3 py-3 text-xs text-muted-foreground text-center">{t("common.none")}</div>
      ) : (
        filteredOptions.map((option, index) => {
          const isSelected = isOptionSelected(values, option);
          return (
            <div
              key={option}
              id={`${resolvedId}-opt-${index}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => onToggleOption(option)}
              className={cn(
                "flex min-h-9 items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors select-none",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <span className="truncate flex-1">{formatContactOptionLabel(option, t) || option}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-background",
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
                {canRemoveOptions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => onRemoveOption(option, event)}
                    className={cn("h-7 w-7 rounded transition-colors", REMOVE_BTN)}
                    aria-label={t("contacts.form.removeOption", { option })}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
