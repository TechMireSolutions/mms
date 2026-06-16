import React, { memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical, Check } from "lucide-react";
import { type ModuleFieldDef } from "@mms/shared";

/** Human-readable labels for every supported custom field type. */
const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Long Text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  tags: "Tags",
  boolean: "Yes / No",
  url: "URL",
  email: "Email",
};

interface FieldItemProps {
  field: ModuleFieldDef;
  isEnabled: boolean;
  isRequired: boolean;
  onToggleEnabled: () => void;
  onToggleRequired: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
}

const FieldItem = memo(
  /**
   * FieldItem component rendering a single field setting row.
   */
  function FieldItem({
    field,
    isEnabled,
    isRequired,
    onToggleEnabled,
    onToggleRequired,
    dragHandleProps,
    isDragging,
  }: FieldItemProps): React.JSX.Element {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all select-none text-xs
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
          aria-label="Drag to reorder field"
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
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{field.label}</p>
          </div>
          {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}
        </div>

        {/* Required toggle */}
        {isEnabled && (
            <button
              type="button"
              onClick={onToggleRequired}
              className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all disabled:opacity-75 disabled:cursor-not-allowed
              ${
                isRequired
                  ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {isRequired ? "Required" : "Optional"}
          </button>
        )}
      </div>
    );
  }
);

interface DraggableFieldListProps {
  tabId: string;
  fields: ModuleFieldDef[];
  enabledSet: Set<string>;
  requiredSet: Set<string>;
  onToggleEnabled: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onReorder: (reordered: ModuleFieldDef[]) => void;
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
  onReorder,
}: DraggableFieldListProps): React.JSX.Element {
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
        No fields available for this tab.
      </p>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`tab-fields-${tabId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 bg-card rounded-lg">
            {fields.map((field, index) => (
              <Draggable key={field.id} draggableId={field.id} index={index}>
                {(drag, snapshot) => {
                  const { style, ...draggableProps } = drag.draggableProps;
                  return (
                  <div ref={drag.innerRef} {...draggableProps} style={style as React.CSSProperties}>
                    <FieldItem
                      field={field}
                      isEnabled={enabledSet.has(field.id)}
                      isRequired={requiredSet.has(field.id)}
                      onToggleEnabled={() => onToggleEnabled(field.id)}
                      onToggleRequired={() => onToggleRequired(field.id)}
                      dragHandleProps={drag.dragHandleProps}
                      isDragging={snapshot.isDragging}
                    />
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
