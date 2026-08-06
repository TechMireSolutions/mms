import React, { useState } from "react";
import { X } from "lucide-react";
import type { StudentLookupKind } from "@mms/shared";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useStudentLookupMutation } from "@/tenant/features/students/hooks/useStudentLookups";

type LookupKindEditorProps = {
  kind: Exclude<StudentLookupKind, "discountTypes">;
  titleKey: "students.setup.lookupsStatuses" | "students.setup.lookupsGenderFilters";
  hintKey: "students.setup.lookupsStatusesHint" | "students.setup.lookupsGenderFiltersHint";
  items: string[];
  disabled: boolean;
};

function LookupKindEditor({
  kind,
  titleKey,
  hintKey,
  items,
  disabled,
}: LookupKindEditorProps): React.ReactElement {
  const { t } = useTranslation();
  const mutation = useStudentLookupMutation();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next: string[]): Promise<void> => {
    setSaving(true);
    try {
      await mutation.mutateAsync({ kind, items: next });
      notify.success(t("students.setup.lookupsSaved"));
    } catch {
      notify.error(t("students.setup.lookupsSaveFailed"));
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
          placeholder={t("students.setup.lookupsAddPlaceholder")}
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

export function StudentsSettingsLookupsPanel(): React.ReactElement {
  const { statuses, genderFilters } = useStudentConfig();
  const { t } = useTranslation();

  return (
    <div className="space-y-6" aria-label={t("students.setup.lookups")}>
      <LookupKindEditor
        kind="statuses"
        titleKey="students.setup.lookupsStatuses"
        hintKey="students.setup.lookupsStatusesHint"
        items={statuses}
        disabled={false}
      />
      <LookupKindEditor
        kind="genderFilters"
        titleKey="students.setup.lookupsGenderFilters"
        hintKey="students.setup.lookupsGenderFiltersHint"
        items={genderFilters}
        disabled={false}
      />
    </div>
  );
}
