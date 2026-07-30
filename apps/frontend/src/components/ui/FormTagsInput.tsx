import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

interface TagsInputProps {
  selected?: string[];
  predefined?: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  name?: string;
}

export function TagsInput({ selected = [], predefined = [], onChange, id, name }: TagsInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackId = React.useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;

  const toggle = (tag: string): void => {
    if (selected.includes(tag)) {
      onChange(selected.filter((selectedTag) => selectedTag !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustom = (raw: string): void => {
    const tag = raw.trim();
    if (!tag || selected.includes(tag)) return;
    onChange([...selected, tag]);
    setInputVal("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if ((event.key === "Enter" || event.key === ",") && inputVal.trim()) {
      event.preventDefault();
      addCustom(inputVal);
    } else if (event.key === "Backspace" && !inputVal && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  const remove = (tag: string): void => {
    onChange(selected.filter((selectedTag) => selectedTag !== tag));
  };

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => remove(tag)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center -me-1 rounded-full hover:text-destructive focus:outline-none transition-colors"
                aria-label={t("contacts.form.removeTag", { tag })}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {predefined.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {predefined.filter((predefinedTag) => !selected.includes(predefinedTag)).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              onClick={() => toggle(tag)}
              className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 rounded-full text-xs font-medium border border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {tag}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          id={resolvedId}
          name={resolvedName}
          ref={inputRef}
          className="flex-1"
          value={inputVal}
          onChange={(event) => setInputVal(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputVal.trim()) addCustom(inputVal);
          }}
          placeholder={t("contacts.form.typeTagPlaceholder")}
        />
        {inputVal.trim() && (
          <Button
            type="button"
            size="sm"
            onClick={() => addCustom(inputVal)}
            className="px-3 min-h-11 text-xs font-semibold flex-shrink-0"
          >
            {t("common.add")}
          </Button>
        )}
      </div>
    </div>
  );
}
