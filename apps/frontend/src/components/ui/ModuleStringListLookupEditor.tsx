import React, { useState } from "react";
import { X } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

export type ModuleStringListLookupEditorProps = {
  titleKey: AppTranslationKey;
  hintKey: AppTranslationKey;
  items: string[];
  disabled?: boolean;
  addPlaceholderKey?: AppTranslationKey;
  onPersist: (next: string[]) => Promise<void>;
  savedToastKey?: AppTranslationKey;
  saveFailedToastKey?: AppTranslationKey;
};

/** Generic string-list lookup editor for module Setup Lookups panels. */
export function ModuleStringListLookupEditor({
  titleKey,
  hintKey,
  items,
  disabled = false,
  addPlaceholderKey = "students.setup.lookupsAddPlaceholder",
  onPersist,
  savedToastKey = "students.setup.lookupsSaved",
  saveFailedToastKey = "students.setup.lookupsSaveFailed",
}: ModuleStringListLookupEditorProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next: string[]): Promise<void> => {
    setSaving(true);
    try {
      await onPersist(next);
      notify.success(t(savedToastKey));
    } catch {
      notify.error(t(saveFailedToastKey));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (): void => {
    const text = draft.trim();
    if (!text || disabled || saving) return;
    const exists = items.some((item) => item.toLowerCase() === text.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    void persist([...items, text]).then(() => setDraft(""));
  };

  const handleRemove = (label: string): void => {
    if (disabled || saving) return;
    void persist(items.filter((item) => item !== label));
  };

  return (
    <Field label={t(titleKey)} hint={t(hintKey)}>
      <ul className="flex flex-wrap gap-2 mb-2" aria-label={t(titleKey)}>
        {items.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground"
          >
            <span>{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={disabled || saving}
              aria-label={t("common.delete")}
              onClick={() => handleRemove(item)}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          className={FORM_INPUT}
          value={draft}
          disabled={disabled || saving}
          placeholder={t(addPlaceholderKey)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || saving || !draft.trim()}
          onClick={handleAdd}
        >
          {t("common.add")}
        </Button>
      </div>
    </Field>
  );
}
