import React, { memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, Check, Settings2 } from "lucide-react";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';


import { FieldDefinition } from "@mms/shared";
import { FieldEditor, CustomFieldConfig } from "./CustomFieldsBuilder";

interface FieldItemProps {
  field: FieldDefinition;
  isEnabled: boolean;
  isRequired: boolean;
  isUnique: boolean;
  onToggleEnabled: () => void;
  onToggleRequired: () => void;
  onToggleUnique?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  defaultValue?: unknown;
  permissions?: string[];
  onChangeDefaults?: (val: unknown) => void;
  onChangePermissions?: (roles: string[]) => void;
  onEditField?: () => void;
  onDeleteField?: () => void;
  uiStrings?: Record<string, string>;
}

const FieldItem = memo(
  /**
   * FieldItem component rendering a single field setting row.
   */
  function FieldItem({
    field,
    isEnabled,
    isRequired,
    isUnique,
    onToggleEnabled,
    onToggleRequired,
    onToggleUnique,
    dragHandleProps,
    isDragging,
    onEdit = undefined,
    onDelete = undefined,
    onChangeDefaults,
    onChangePermissions,
    onEditField,
    onDeleteField,
    uiStrings,
  }: FieldItemProps): React.JSX.Element {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all select-none
          ${
            isDragging
              ? "shadow-lg border-primary/40 bg-primary/5"
              : isEnabled
              ? "border-border bg-card"
              : "border-border/40 bg-muted/20 opacity-55"
          }`}
      >
        {/* Drag handle */}
        <span
          {...(dragHandleProps || {})}
          aria-label={uiStrings?.dragToReorderField || "Drag to reorder field"}
          className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>

        {/* Enable toggle */}
        <button
          type="button"
          onClick={onToggleEnabled}
          className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer
            ${isEnabled ? "bg-primary border-primary" : "border-border bg-background"}`}
        >
          {isEnabled && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
        </button>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-foreground">{field.label}</p>
            {isUnique && !onToggleUnique && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 dark:bg-warning/20 dark:text-warning dark:border-warning/30">
                {uiStrings?.fieldUnique || "Unique"}
              </span>
            )}
          </div>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
        </div>

        {/* Required toggle */}
        {isEnabled && (
          <button
            type="button"
            onClick={onToggleRequired}
            className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all
              ${
                isRequired
                  ? "bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20 dark:border-destructive/30 dark:text-destructive"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {isRequired ? (uiStrings?.fieldRequired || "Required") : (uiStrings?.fieldOptional || "Optional")}
          </button>
        )}

        {/* Unique toggle */}
        {isEnabled && onToggleUnique && (
          <button
            type="button"
            onClick={onToggleUnique}
            className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all
              ${
                isUnique
                  ? "bg-warning/10 border-warning/30 text-warning dark:bg-warning/20 dark:border-warning/30 dark:text-warning"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {isUnique ? (uiStrings?.fieldUnique || "Unique") : (uiStrings?.fieldStandard || "Standard")}
          </button>
        )}

        {/* Edit Defaults Button */}
        {(onChangeDefaults || onChangePermissions) && (
          <button
            type="button"
            onClick={onEdit}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={uiStrings?.editDefaultsAndPermissions || "Edit Defaults & Permissions"}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        )}

        {onEditField && (
          <button
            type="button"
            onClick={onEditField}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={uiStrings?.editFieldTitle || "Edit Field"}
          >
            <span className="text-[10px] font-bold tracking-wider uppercase">{uiStrings?.editField || "Edit"}</span>
          </button>
        )}

        {onDeleteField && (
          <button
            type="button"
            onClick={onDeleteField}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={uiStrings?.deleteFieldTitle || "Delete Field"}
          >
            <span className="text-[10px] font-bold tracking-wider uppercase text-destructive">{uiStrings?.deleteField || "Del"}</span>
          </button>
        )}
      </div>
    );
  }
);

interface DraggableFieldListProps {
  tabId: string;
  fields: FieldDefinition[];
  enabledSet: Set<string>;
  requiredSet: Set<string>;
  onToggleEnabled: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onToggleUnique?: (id: string) => void;
  onReorder: (reordered: FieldDefinition[]) => void;
  isUniqueField?: (tabId: string, fieldId: string) => boolean;
  defaultValues?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
  onChangeDefaults?: (fieldId: string, val: unknown) => void;
  onChangePermissions?: (fieldId: string, roles: string[]) => void;
  onEditField?: (field: FieldDefinition) => void;
  onDeleteField?: (fieldId: string) => void;
}

/**
 * DraggableFieldList component rendering a sortable set of fields for a tab layout config.
 * @param props Component properties.
 * @returns React element.
 */
export default function DraggableFieldList({
  tabId,
  fields,
  enabledSet,
  requiredSet,
  onToggleEnabled,
  onToggleRequired,
  onToggleUnique,
  onReorder,
  isUniqueField,
  defaultValues = {},
  permissions = {},
  onChangeDefaults,
  onChangePermissions,
  onEditField,
  onDeleteField
}: DraggableFieldListProps): React.JSX.Element {
  const { uiStrings } = useContactConfig();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [fullEditingId, setFullEditingId] = React.useState<string | null>(null);

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
        {uiStrings?.noFieldsAvailable || "No fields available for this tab."}
      </p>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`tab-fields-${tabId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 bg-card rounded-lg">
            {fields.map((field, index) => (
              <Draggable key={field.key} draggableId={field.key} index={index}>
                {(drag, snapshot) => {
                  const { style, ...draggableProps } = drag.draggableProps;
                  return (
                  <div ref={drag.innerRef} {...draggableProps} style={style as React.CSSProperties} className="flex flex-col gap-1">
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
                      onChangePermissions={onChangePermissions ? (roles) => onChangePermissions(field.key, roles) : undefined}
                      onEdit={() => { setEditingId(editingId === field.key ? null : field.key); setFullEditingId(null); }}
                      onEditField={onEditField ? () => { setFullEditingId(fullEditingId === field.key ? null : field.key); setEditingId(null); } : undefined}
                      onDeleteField={onDeleteField ? () => onDeleteField(field.key) : undefined}
                      uiStrings={uiStrings}
                    />
                    {editingId === field.key && !fullEditingId && (
                      <div className="ml-8 p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                            {uiStrings?.defaultValueLabel || "Default Value"}
                          </label>
                          <input
                            className="w-full px-2 py-1.5 rounded-md border border-border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            value={(defaultValues[field.key] as string) || ""}
                            onChange={(e) => onChangeDefaults?.(field.key, e.target.value)}
                            placeholder={uiStrings?.defaultValuePlaceholder || "Leave blank for none"}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                            {uiStrings?.permissionsLabel || "Permissions (comma separated roles)"}
                          </label>
                          <input
                            className="w-full px-2 py-1.5 rounded-md border border-border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            value={(permissions[field.key] || []).join(", ")}
                            onChange={(e) => onChangePermissions?.(field.key, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder={uiStrings?.permissionsPlaceholder || "e.g. admin, manager"}
                          />
                        </div>
                      </div>
                    )}
                    {fullEditingId === field.key && onEditField && (
                      <div className="ml-8 mt-1">
                        <FieldEditor
                          field={field}
                          existingLabels={fields.map(f => f.label)}
                          onSave={(f) => {
                            onEditField(f);
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
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
