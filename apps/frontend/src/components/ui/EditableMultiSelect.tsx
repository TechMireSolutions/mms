import React, { useId, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FORM_INPUT_COMPACT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  buildAddedTags,
  filterOptionsByQuery,
  removeOptionFromCatalog,
  removeSelectedValue,
  toggleSelectedValue,
} from "@/components/ui/editableMultiSelectUtils";
import {
  EditableMultiSelectChipRow,
  EditableMultiSelectOptionList,
  EditableMultiSelectSearchBar,
} from "@/components/ui/EditableMultiSelectParts";

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
  error?: boolean;
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
  error = false,
}: EditableMultiSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  const fallbackId = useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  const listboxId = `${resolvedId}-multi-listbox`;
  const resolvedPlaceholder = placeholder ?? t("contacts.form.selectOption");
  const addInputLabel = addPlaceholder ?? t("contacts.form.addNewTypePlaceholder");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const canRemoveOptions = Boolean(onUpdateOptions);

  const toggleOption = (option: string): void => {
    onChange(toggleSelectedValue(values, option));
  };

  const removeValue = (valToRemove: string, event: React.MouseEvent): void => {
    event.stopPropagation();
    onChange(removeSelectedValue(values, valToRemove));
    triggerRef.current?.focus();
  };

  const handleRemoveOption = (option: string, event: React.MouseEvent): void => {
    if (!onUpdateOptions) return;
    event.stopPropagation();
    const { nextOptions, nextValues } = removeOptionFromCatalog(options, values, option);
    onUpdateOptions(nextOptions);
    onChange(nextValues);
  };

  const handleAdd = (valueToAdd?: string): void => {
    const rawText = (valueToAdd ?? newTagValue).trim();
    if (!rawText) return;

    const { nextValues, nextOptions, optionsChanged } = buildAddedTags(
      rawText,
      options,
      values,
      canRemoveOptions,
    );

    if (optionsChanged && onUpdateOptions) {
      onUpdateOptions(nextOptions);
    }
    onChange(nextValues);
    setNewTagValue("");
  };

  const filteredOptions = filterOptionsByQuery(options, searchQuery);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && newTagValue.trim()) {
          handleAdd(newTagValue);
        }
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
          "min-h-11 w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-start cursor-pointer touch-manipulation",
          error && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          <EditableMultiSelectChipRow
            values={values}
            placeholder={resolvedPlaceholder}
            t={t}
            onRemoveValue={removeValue}
          />
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-64 max-h-80 flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl divide-y divide-border/60"
      >
        {options.length > 4 && (
          <EditableMultiSelectSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            t={t}
          />
        )}

        <EditableMultiSelectOptionList
          resolvedId={resolvedId}
          listboxId={listboxId}
          filteredOptions={filteredOptions}
          values={values}
          canRemoveOptions={canRemoveOptions}
          t={t}
          onToggleOption={toggleOption}
          onRemoveOption={handleRemoveOption}
        />

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
              className={INPUT_CLASS}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleAdd()}
              disabled={!newTagValue.trim()}
              className="px-2.5 min-h-11 text-xs font-semibold rounded-lg flex-shrink-0 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("common.add")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
