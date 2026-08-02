import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelectPopover } from "@/components/ui/OptionSelectPopover";
import { useTranslation } from "@/hooks/useTranslation";

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
  const [customValue, setCustomValue] = useState("");
  const customInputId = React.useId();

  const handleAdd = (close: () => void): void => {
    if (!onUpdateOptions) return;
    const text = customValue.trim();
    if (!text) return;
    const existing = options.find((opt) => opt.trim().toLowerCase() === text.toLowerCase());
    if (existing) {
      onChange(existing);
    } else {
      onUpdateOptions([...options, text]);
      onChange(text);
    }
    setCustomValue("");
    close();
  };

  return (
    <OptionSelectPopover
      options={options}
      value={value}
      onChange={onChange}
      onUpdateOptions={onUpdateOptions}
      placeholder={placeholder}
      className={className}
      id={id}
      name={name}
      onOpenChange={(open) => {
        if (!open) setCustomValue("");
      }}
      footer={
        onUpdateOptions
          ? ({ close }) => (
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
                      handleAdd(close);
                    }
                  }}
                  placeholder={t("contacts.form.addNewTypePlaceholder")}
                  className="h-auto min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAdd(close)}
                  className="px-2.5 text-xs font-semibold rounded-lg flex-shrink-0"
                >
                  {t("common.add")}
                </Button>
              </div>
            )
          : null
      }
    />
  );
}
