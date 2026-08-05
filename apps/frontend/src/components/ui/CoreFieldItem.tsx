import React, { memo } from "react";
import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, SlidersHorizontal } from "lucide-react";
import { type FieldDefinition } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface FieldItemProps {
  field: FieldDefinition;
  isEnabled: boolean;
  isRequired: boolean;
  isUnique?: boolean;
  onToggleEnabled: () => void;
  onToggleRequired: () => void;
  onToggleUnique?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
  onEdit?: () => void;
  onChangeDefaults?: (fieldValue: unknown) => void;
  onChangePermissions?: (roles: string[]) => void;
  onEditField?: () => void;
  onDeleteField?: () => void;
  isCoreField?: boolean;
  labels?: {
    required?: string;
    optional?: string;
    unique?: string;
    standard?: string;
  };
}

export const CoreFieldItem = memo(function CoreFieldItem({
  field,
  isEnabled,
  isRequired,
  isUnique = false,
  onToggleEnabled,
  onToggleRequired,
  onToggleUnique,
  dragHandleProps,
  isDragging,
  onEdit,
  onChangeDefaults,
  onChangePermissions,
  onEditField,
  onDeleteField,
  labels,
}: FieldItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const lblRequired = labels?.required || t("common.required");
  const lblOptional = labels?.optional || t("common.optional");
  const lblUnique = labels?.unique || t("common.unique");
  const lblNotUnique = labels?.standard || t("common.notUnique");

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-3 transition-all select-none sm:gap-3 sm:px-5 sm:py-4
          ${
            isDragging
              ? "shadow-lg border-primary/40 bg-primary/5"
              : isEnabled
              ? "border-border bg-card shadow-sm hover:shadow-md"
              : "border-border/40 bg-muted/20 opacity-55"
          }`}
    >
      <span
        {...(dragHandleProps || {})}
        aria-label={t("fields.dragReorderAria")}
        className="inline-flex min-h-11 min-w-11 flex-shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground/80 active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      <Checkbox
        checked={isEnabled}
        onCheckedChange={onToggleEnabled}
        aria-label={t("fields.enableAria")}
        className="w-4 h-4"
      />

      <div className="min-w-0 flex-1 basis-[10rem] text-start">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold leading-snug text-foreground">
            {field.labelKey ? t(field.labelKey) : field.label}
          </p>
          {isUnique && !onToggleUnique && (
            <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-xs font-bold text-warning dark:border-warning/30 dark:bg-warning/20 dark:text-warning">
              {lblUnique}
            </span>
          )}
        </div>
        {(field.descriptionKey || field.description) ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {field.descriptionKey ? t(field.descriptionKey) : field.description}
          </p>
        ) : null}
      </div>

      <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
        {isEnabled && (
          <Button
            type="button"
            onClick={onToggleRequired}
            variant="outline"
            size="sm"
            className={`flex-shrink-0 rounded-md border px-3 text-xs font-semibold shadow-none transition-all
              ${
                isRequired
                  ? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
          >
            {isRequired ? lblRequired : lblOptional}
          </Button>
        )}

        {isEnabled && onToggleUnique && (
          <Button
            type="button"
            onClick={onToggleUnique}
            variant="outline"
            size="sm"
            className={`flex-shrink-0 rounded-md border px-3 text-xs font-semibold shadow-none transition-all
              ${
                isUnique
                  ? "border-warning/20 bg-warning/10 text-warning hover:bg-warning/15"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
          >
            {isUnique ? lblUnique : lblNotUnique}
          </Button>
        )}

        {(onChangeDefaults || onChangePermissions) && (
          <Button
            type="button"
            onClick={onEdit}
            variant="ghost"
            className="flex h-11 w-11 min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg p-0 text-muted-foreground/80 shadow-none transition-colors hover:bg-muted hover:text-foreground"
            title={t("fields.editDefaultsTitle")}
            aria-label={t("fields.editDefaultsTitle")}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        )}

        {onEditField && (
          <Button
            type="button"
            onClick={onEditField}
            variant="ghost"
            className="flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-semibold text-muted-foreground/80 shadow-none transition-colors hover:bg-muted hover:text-foreground"
            title={t("fields.editCustomFieldTitle")}
          >
            <span>{t("common.edit")}</span>
          </Button>
        )}

        {onDeleteField && (
          <Button
            type="button"
            onClick={onDeleteField}
            variant="ghost"
            className="flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-semibold text-destructive shadow-none transition-colors hover:bg-destructive/10 hover:text-destructive"
            title={t("fields.deleteCustomFieldTitle")}
          >
            <span>{t("common.delete")}</span>
          </Button>
        )}
      </div>
    </div>
  );
});
