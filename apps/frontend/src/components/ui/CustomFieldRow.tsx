import type React from "react";
import { useState } from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { AlertTriangle, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FIELD_TYPE_KEYS,
  normalizeOptions,
  type CustomFieldConfig,
} from "./customFieldsBuilderUtils";

interface FieldRowProps {
  field: CustomFieldConfig;
  isDragging: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function FieldRow({
  field,
  isDragging,
  dragHandleProps,
  onEdit,
  onDelete,
}: FieldRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState<boolean>(false);
  const typeKey = FIELD_TYPE_KEYS.find((typeOption) => typeOption.value === field.type)?.labelKey;
  const typeLabel = typeKey ? t(typeKey) : field.type;
  const optionCount = normalizeOptions(field.options).length;

  if (confirming) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 dark:bg-destructive/20 dark:border-destructive/30">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        <p className="flex-1 text-xs text-destructive dark:text-destructive font-medium">
          {t("fields.deleteConfirm", { name: field.label })}
        </p>
        <Button
          type="button"
          onClick={() => setConfirming(false)}
          variant="outline"
          className="px-2.5 py-2 min-h-11 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setConfirming(false);
            onDelete();
          }}
          variant="destructive"
          className="px-2.5 py-2 min-h-11 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors shadow-none"
        >
          {t("common.delete")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all
        ${isDragging ? "shadow-lg border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
    >
      <span
        {...(dragHandleProps || {})}
        aria-label={t("fields.dragReorderAria")}
        className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      <div className="flex-1 min-w-0 text-start">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{field.label}</span>
          <span className="text-xs text-muted-foreground">{typeLabel}</span>
          {field.required && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/30">
              Required
            </span>
          )}
          {field.unique && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 dark:bg-warning/20 dark:text-warning dark:border-warning/30">
              Unique
            </span>
          )}
          {optionCount > 0 && (
            <span className="text-xs text-muted-foreground">
              [{optionCount} {field.type === "tags" ? "tags" : "options"}]
            </span>
          )}
          {field.type === "number" && field.mask && (
            <span className="text-xs text-muted-foreground font-mono">mask: {field.mask}</span>
          )}
        </div>
        {field.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{field.description}</p>}
      </div>

      <Button
        type="button"
        onClick={onEdit}
        variant="ghost"
        className="min-h-11 min-w-11 h-11 w-11 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-none"
        aria-label={t("fields.editNamedAria", { name: field.label })}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        onClick={() => setConfirming(true)}
        variant="ghost"
        className="min-h-11 min-w-11 h-11 w-11 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shadow-none"
        aria-label={t("fields.deleteNamedAria", { name: field.label })}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
