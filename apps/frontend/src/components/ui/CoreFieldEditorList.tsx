import React, { memo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, SlidersHorizontal } from "lucide-react";
import { FieldDefinition } from "@mms/shared";
import { FieldEditor } from "@/components/ui/CustomFieldsBuilder";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  defaultValue?: unknown;
  permissions?: string[];
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

const FieldItem = memo(function FieldItem({
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
  isCoreField = false,
  labels,
}: FieldItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const lblRequired = labels?.required || t("common.required");
  const lblOptional = labels?.optional || t("common.optional");
  const lblUnique = labels?.unique || t("common.unique");
  const lblStandard = labels?.standard || t("common.standard");

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
          {isUnique ? lblUnique : lblStandard}
        </Button>
      )}

      {(onChangeDefaults || onChangePermissions) && (
        <Button
          type="button"
          onClick={onEdit}
          variant="ghost"
          className="flex h-11 w-11 min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg p-0 text-muted-foreground/80 shadow-none transition-colors hover:bg-muted hover:text-foreground"
          title={t("fields.editDefaultsTitle")}
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

interface CoreFieldEditorListProps {
  tabId: string;
  fields: FieldDefinition[];
  enabledSet: Set<string>;
  requiredSet: Set<string>;
  onToggleEnabled: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onToggleUnique?: (id: string) => void;
  onReorder: (reordered: FieldDefinition[]) => void;
  isUniqueField?: (tabId: string, fieldId: string) => boolean;
  isCoreField?: (fieldKey: string) => boolean;
  defaultValues?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
  onChangeDefaults?: (fieldId: string, val: unknown) => void;
  onChangePermissions?: (fieldId: string, roles: string[]) => void;
  onEditField?: (field: FieldDefinition) => void;
  onDeleteField?: (fieldId: string) => void;
  labels?: {
    required?: string;
    optional?: string;
    unique?: string;
    standard?: string;
  };
}

export function CoreFieldEditorList({
  tabId,
  fields,
  enabledSet,
  requiredSet,
  onToggleEnabled,
  onToggleRequired,
  onToggleUnique,
  onReorder,
  isUniqueField,
  isCoreField,
  defaultValues = {},
  permissions = {},
  onChangeDefaults,
  onChangePermissions,
  onEditField,
  onDeleteField,
  labels,
}: CoreFieldEditorListProps): React.JSX.Element {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullEditingId, setFullEditingId] = useState<string | null>(null);

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(fields);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  if (fields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded-lg bg-card">
        {t("fields.noFieldsAvailable")}
      </p>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`tab-fields-${tabId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 bg-transparent">
            {fields.map((field, index) => {
              const core = isCoreField ? isCoreField(field.key) : false;
              return (
                <Draggable key={field.key} draggableId={field.key} index={index}>
                  {(drag, snapshot) => {
                    const { style, ...draggableProps } = drag.draggableProps;
                    return (
                      <div ref={drag.innerRef} {...draggableProps} style={style as React.CSSProperties} className="flex flex-col gap-1.5">
                        <FieldItem
                          field={field}
                          isEnabled={enabledSet.has(field.key)}
                          isRequired={requiredSet.has(field.key)}
                          isUnique={isUniqueField?.(tabId, field.key) || false}
                          onToggleEnabled={() => onToggleEnabled(field.key)}
                          onToggleRequired={() => onToggleRequired(field.key)}
                          onToggleUnique={onToggleUnique ? () => onToggleUnique(field.key) : undefined}
                          dragHandleProps={drag.dragHandleProps}
                          isDragging={snapshot.isDragging}
                          defaultValue={defaultValues[field.key]}
                          permissions={permissions[field.key]}
                          onChangeDefaults={onChangeDefaults ? (fieldValue) => onChangeDefaults(field.key, fieldValue) : undefined}
                          onChangePermissions={onChangePermissions && !core ? (roles) => onChangePermissions(field.key, roles) : undefined}
                          onEdit={() => { setEditingId(editingId === field.key ? null : field.key); setFullEditingId(null); }}
                          onEditField={onEditField && !core ? () => { setFullEditingId(fullEditingId === field.key ? null : field.key); setEditingId(null); } : undefined}
                          onDeleteField={onDeleteField && !core ? () => onDeleteField(field.key) : undefined}
                          isCoreField={core}
                          labels={labels}
                        />
                        {editingId === field.key && !fullEditingId && (
                          <div className="ms-8 p-3 rounded-lg border border-border bg-muted/20 space-y-3 text-start">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                                {t("fields.defaultValueLabel")}
                              </label>
                              <Input
                                className="text-xs py-2 min-h-11 bg-background"
                                value={(defaultValues[field.key] as string) || ""}
                                onChange={(event) => onChangeDefaults?.(field.key, event.target.value)}
                                placeholder={t("fields.defaultValuePlaceholder")}
                              />
                            </div>
                            {!core && (
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                                  {t("fields.permissionsLabel")}
                                </label>
                                <Input
                                  className="text-xs py-2 min-h-11 bg-background"
                                  value={(permissions[field.key] || []).join(", ")}
                                  onChange={(event) => onChangePermissions?.(field.key, event.target.value.split(",").map((role) => role.trim()).filter(Boolean))}
                                  placeholder={t("fields.permissionsPlaceholder")}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {fullEditingId === field.key && onEditField && (
                          <div className="ms-8 mt-1">
                            <FieldEditor
                              field={field}
                              existingLabels={fields.map((fieldDefinition) => fieldDefinition.label)}
                              onSave={(updatedField) => {
                                onEditField(updatedField);
                                setFullEditingId(null);
                              }}
                              onCancel={() => setFullEditingId(null)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
