import type React from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { FieldEditor } from "./CustomFieldEditor";
import { newField, type CustomFieldConfig } from "./customFieldsBuilderUtils";

export { FieldEditor } from "./CustomFieldEditor";
export type { CustomFieldConfig } from "./customFieldsBuilderUtils";

interface CustomFieldsBuilderProps {
  fields?: CustomFieldConfig[];
  droppableId?: string;
  onChange: (fields: CustomFieldConfig[]) => void;
}

export function CustomFieldsBuilder(props: CustomFieldsBuilderProps): React.JSX.Element {
  const { fields = [], onChange } = props;
  const { t } = useTranslation();
  const [adding, setAdding] = useState<boolean>(false);
  const [draft, setDraft] = useState<CustomFieldConfig | null>(null);

  const existingLabels = fields.map((field) => field.label);

  const startAdd = (): void => {
    setAdding(true);
    setDraft(newField());
  };

  const handleCreateField = (field: CustomFieldConfig): void => {
    onChange([...fields, field]);
    setAdding(false);
    setDraft(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 text-start sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-foreground">{t("customFields.title")}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("customFields.description")}
          </p>
        </div>
        {!adding && (
          <Button
            type="button"
            onClick={startAdd}
            className="flex w-full sm:w-auto shrink-0 items-center gap-1.5 px-3.5 py-2 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("customFields.add")}</span>
          </Button>
        )}
      </div>

      {adding && draft && (
        <FieldEditor
          field={draft}
          existingLabels={existingLabels}
          onSave={handleCreateField}
          onCancel={() => {
            setAdding(false);
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}
