import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelectPopover } from "@/components/ui/OptionSelectPopover";
import { useTranslation } from "@/hooks/useTranslation";

interface RelationshipTypeSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** Replace the flat option list (used when removing a label). */
  onUpdateOptions?: (options: string[]) => void;
  /**
   * Add a 2-sided pair. Return the forward label to select on success,
   * or null when the add was rejected (empty / duplicate).
   */
  onAddPair?: (forward: string, inverse: string) => string | null | Promise<string | null>;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

const INPUT_CLASS =
  "h-auto min-h-11 min-w-0 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40";

export function RelationshipTypeSelect({
  options,
  value,
  onChange,
  onUpdateOptions,
  onAddPair,
  placeholder,
  className = "w-28",
  id,
  name,
}: RelationshipTypeSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const [forwardValue, setForwardValue] = useState("");
  const [inverseValue, setInverseValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const forwardInputId = React.useId();
  const inverseInputId = React.useId();

  const clearAddFields = (): void => {
    setForwardValue("");
    setInverseValue("");
  };

  const handleAdd = async (close: () => void): Promise<void> => {
    if (!onAddPair || isAdding) return;
    setIsAdding(true);
    try {
      const selected = await onAddPair(forwardValue, inverseValue);
      if (selected == null) return;
      onChange(selected);
      clearAddFields();
      close();
    } finally {
      setIsAdding(false);
    }
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
      contentMinWidthClass="min-w-[16rem]"
      onOpenChange={(open) => {
        if (!open) clearAddFields();
      }}
      footer={
        onAddPair
          ? ({ close }) => (
              <div className="p-2 space-y-2 bg-muted/20 flex-shrink-0">
                <p className="px-0.5 text-[11px] leading-snug text-muted-foreground">
                  {t("contacts.form.addRelationshipPairHint")}
                </p>
                <Input
                  id={forwardInputId}
                  name={forwardInputId}
                  type="text"
                  value={forwardValue}
                  onChange={(event) => setForwardValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleAdd(close);
                    }
                  }}
                  placeholder={t("contacts.form.forwardRelationshipPlaceholder")}
                  aria-label={t("contacts.form.forwardRelationshipPlaceholder")}
                  disabled={isAdding}
                  className={INPUT_CLASS}
                />
                <Input
                  id={inverseInputId}
                  name={inverseInputId}
                  type="text"
                  value={inverseValue}
                  onChange={(event) => setInverseValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleAdd(close);
                    }
                  }}
                  placeholder={t("contacts.form.reciprocalRelationshipPlaceholder")}
                  aria-label={t("contacts.form.reciprocalRelationshipPlaceholder")}
                  disabled={isAdding}
                  className={INPUT_CLASS}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void handleAdd(close);
                  }}
                  disabled={isAdding}
                  className="w-full px-2.5 text-xs font-semibold rounded-lg"
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
