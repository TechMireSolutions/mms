import React, { memo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, SlidersHorizontal } from "lucide-react";
import { FieldDefinition } from "@mms/shared";
import { FieldEditor } from "./CustomFieldsBuilder";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  onChangeDefaults?: (val: unknown) => void;
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
  const lblRequired = labels?.required || "Required";
  const lblOptional = labels?.optional || "Optional";
  const lblUnique = labels?.unique || "Unique";
  const lblStandard = labels?.standard || "Standard";

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all select-none
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
        aria-label="Drag to reorder field"
        className="flex-shrink-0 cursor-grab text-muted-foreground/60 hover:text-foreground/80 active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      <Checkbox
        checked={isEnabled}
        onCheckedChange={onToggleEnabled}
        aria-label="Enable field"
        className="w-4 h-4"
      />

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-foreground leading-snug">{field.label}</p>
          {isUnique && !onToggleUnique && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 dark:bg-warning/20 dark:text-warning dark:border-warning/30">
              {lblUnique}
            </span>
          )}
        </div>
        {field.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{field.description}</p>}
      </div>

      {isEnabled && (
        <Button
          type="button"
          onClick={onToggleRequired}
          variant="outline"
          size="sm"
          className={`flex-shrink-0 h-7 px-3 text-xs font-semibold rounded-md border transition-all shadow-none
              ${
                isRequired
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/80 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
          className={`flex-shrink-0 h-7 px-3 text-xs font-semibold rounded-md border transition-all shadow-none
              ${
                isUnique
                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
          className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0 rounded-lg text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors shadow-none"
          title="Edit Defaults and Permissions"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      )}

      {onEditField && (
        <Button
          type="button"
          onClick={onEditField}
          variant="ghost"
          className="h-8 px-2.5 flex items-center justify-center flex-shrink-0 rounded-lg text-xs font-semibold text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors shadow-none"
          title="Edit Custom Field Type / Options"
        >
          <span>Edit</span>
        </Button>
      )}

      {onDeleteField && (
        <Button
          type="button"
          onClick={onDeleteField}
          variant="ghost"
          className="h-8 px-2.5 flex items-center justify-center flex-shrink-0 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shadow-none"
          title="Delete Custom Field"
        >
          <span>Delete</span>
        </Button>
      )}
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
        No fields available.
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
                          onChangeDefaults={onChangeDefaults ? (val) => onChangeDefaults(field.key, val) : undefined}
                          onChangePermissions={onChangePermissions && !core ? (roles) => onChangePermissions(field.key, roles) : undefined}
                          onEdit={() => { setEditingId(editingId === field.key ? null : field.key); setFullEditingId(null); }}
                          onEditField={onEditField && !core ? () => { setFullEditingId(fullEditingId === field.key ? null : field.key); setEditingId(null); } : undefined}
                          onDeleteField={onDeleteField && !core ? () => onDeleteField(field.key) : undefined}
                          isCoreField={core}
                          labels={labels}
                        />
                        {editingId === field.key && !fullEditingId && (
                          <div className="ml-8 p-3 rounded-lg border border-border bg-muted/20 space-y-3 text-left">
                            <div>
                              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                                Default Value
                              </label>
                              <Input
                                className="text-xs py-1.5 h-8 bg-background"
                                value={(defaultValues[field.key] as string) || ""}
                                onChange={(e) => onChangeDefaults?.(field.key, e.target.value)}
                                placeholder="Set default value"
                              />
                            </div>
                            {!core && (
                              <div>
                                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                                  Permissions (comma-separated roles)
                                </label>
                                <Input
                                  className="text-xs py-1.5 h-8 bg-background"
                                  value={(permissions[field.key] || []).join(", ")}
                                  onChange={(e) => onChangePermissions?.(field.key, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                  placeholder="e.g. admin, manager"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {fullEditingId === field.key && onEditField && (
                          <div className="ml-8 mt-1">
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
