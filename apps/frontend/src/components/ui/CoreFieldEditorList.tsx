import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { FieldDefinition } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { FieldItem } from "@/components/ui/CoreFieldEditorFieldItem";
import { FieldEditor } from "@/components/ui/CustomFieldsBuilder";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";

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
  onDeleteField?: (fieldId: string) => void | boolean | Promise<void | boolean>;
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
      <EmptyState
        title={t("fields.noFieldsAvailable")}
        variant="dashed"
        compact
        icon={null}
        className="rounded-lg bg-card"
      />
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
                    const fieldPermissions =
                      permissions[field.key] ?? field.permissions ?? [];
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
                          permissions={fieldPermissions}
                          onChangeDefaults={
                            core && onChangeDefaults
                              ? (fieldValue) => onChangeDefaults(field.key, fieldValue)
                              : undefined
                          }
                          onEdit={
                            core && onChangeDefaults
                              ? () => {
                                  setEditingId(editingId === field.key ? null : field.key);
                                  setFullEditingId(null);
                                }
                              : undefined
                          }
                          onEditField={
                            onEditField && !core
                              ? () => {
                                  setFullEditingId(fullEditingId === field.key ? null : field.key);
                                  setEditingId(null);
                                }
                              : undefined
                          }
                          onDeleteField={onDeleteField && !core ? () => onDeleteField(field.key) : undefined}
                          isCoreField={core}
                          labels={labels}
                        />
                        {editingId === field.key && core && (
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
                          </div>
                        )}
                        {fullEditingId === field.key && onEditField && (
                          <div className="ms-8 mt-1">
                            <FieldEditor
                              field={{
                                ...field,
                                enabled: enabledSet.has(field.key),
                                required: requiredSet.has(field.key),
                                unique: isUniqueField?.(tabId, field.key) || false,
                                defaultValue: defaultValues[field.key] ?? field.defaultValue,
                                permissions: fieldPermissions,
                              }}
                              existingLabels={fields.map((fieldDefinition) => fieldDefinition.label)}
                              listManagedFlags
                              onSave={(updatedField) => {
                                onEditField({
                                  ...updatedField,
                                  enabled: enabledSet.has(field.key),
                                  required: requiredSet.has(field.key),
                                  unique: isUniqueField?.(tabId, field.key) || false,
                                });
                                onChangeDefaults?.(field.key, updatedField.defaultValue);
                                onChangePermissions?.(field.key, updatedField.permissions ?? []);
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
