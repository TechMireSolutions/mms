import React, { useState, useCallback } from "react";
import { Plus, Trash2, Check, X, Pencil, AlertTriangle, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";

/** All supported custom field types with UI labels. */
const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "tags", label: "Tags (multi-select)" },
  { value: "boolean", label: "Yes / No" },
];


// ── ID generation ─────────────────────────────────────────────────────────────
/**
 * Generates a collision-resistant custom field ID.
 * Combines a base-36 timestamp with a 5-character random suffix.
 * @returns Unique field ID.
 */
function generateFieldId(): string {
  return `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Options helpers ───────────────────────────────────────────────────────────
/**
 * Converts an options value to a string[] regardless of its stored shape.
 * Backward-compatible: accepts a comma-separated string (legacy) or string[].
 * @param options Raw options value.
 * @returns Normalized array of option strings.
 */
function normalizeOptions(options: string | string[] | undefined): string[] {
  if (Array.isArray(options)) return options;
  if (typeof options === "string" && options.trim()) {
    return options.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Converts a string[] to a comma-separated display string for the input field.
 * @param arr Array of option strings.
 * @returns Comma-separated display string.
 */
function optionsToString(arr: string[]): string {
  return arr.join(", ");
}

import { FieldDefinition } from "@mms/shared";
import { FORM_LABEL } from "@/components/ui/formStyles";

export type CustomFieldConfig = FieldDefinition;

/**
 * Returns a blank new custom field with sensible defaults.
 * @returns A new custom field configuration object.
 */
function newField(): CustomFieldConfig {
  const uniqueKey = generateFieldId();
  return {
    key: uniqueKey,
    label: "",
    type: "text",
    enabled: true,
    order: 0,
    required: false,
    unique: false,
    placeholder: "",
    description: "",
    defaultValue: "",
    options: [],
  };
}

interface FieldEditorProps {
  field: CustomFieldConfig;
  existingLabels?: string[];
  onSave: (field: CustomFieldConfig) => void;
  onCancel: () => void;
}

interface DraftFieldState extends Omit<CustomFieldConfig, "options"> {
  options: string[];
  _optionsString: string;
}

/**
 * Inline editor panel for creating or modifying a custom field.
 * @param props Component properties.
 * @returns React element.
 */
export function FieldEditor({ field, existingLabels = [], onSave, onCancel }: FieldEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState<DraftFieldState>(() => ({
    ...field,
    options: normalizeOptions(field.options),
    // Transient UI string for the options <input>
    _optionsString: optionsToString(normalizeOptions(field.options)),
  }));

  const upd = useCallback(<K extends keyof DraftFieldState>(k: K, v: DraftFieldState[K]): void => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  // Validation
  const trimmedLabel = draft.label.trim();
  const isDuplicateLabel = existingLabels
    .filter((l) => l !== field.label) // exclude own label when editing
    .some((l) => l.toLowerCase() === trimmedLabel.toLowerCase());
  const isValid = trimmedLabel.length >= 2 && !isDuplicateLabel;

  const handleSave = (): void => {
    if (!isValid) return;
    // Persist options as string[] — strip the transient _optionsString key
    const { _optionsString, ...rest } = draft;
    onSave({ ...rest, options: normalizeOptions(_optionsString) });
  };

  const hasTextLength = draft.type === "text" || draft.type === "textarea";
  const hasOptions = draft.type === "select" || draft.type === "tags";
  const hasNumRange = draft.type === "number";

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      {/* Row 1: Label + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FORM_LABEL} htmlFor={`label-${draft.key}`}>Field Name *</label>
          <Input
            id={`label-${draft.key}`}
            value={draft.label}
            onChange={(e) => upd("label", e.target.value)}
            placeholder="e.g. Father's Name"
            autoFocus
          />
          {isDuplicateLabel && (
            <p className="text-[11px] text-destructive mt-1">A field with this name already exists.</p>
          )}
          {trimmedLabel.length > 0 && trimmedLabel.length < 2 && (
            <p className="text-[11px] text-warning mt-1">Name must be at least 2 characters.</p>
          )}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor={`type-${draft.key}`}>Field Type</label>
          <FormSelect
            id={`type-${draft.key}`}
            value={draft.type}
            onChange={(val) => upd("type", val as FieldDefinition["type"])}
            options={FIELD_TYPES}
          />
        </div>
      </div>

      {/* Row 2: Description + Placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FORM_LABEL} htmlFor={`desc-${draft.key}`}>
            Description <span className="normal-case font-normal text-muted-foreground/70">(admin note)</span>
          </label>
          <Input
            id={`desc-${draft.key}`}
            value={draft.description || ""}
            onChange={(e) => upd("description", e.target.value)}
            placeholder="What is this field for?"
          />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor={`placeholder-${draft.key}`}>Placeholder</label>
          <Input
            id={`placeholder-${draft.key}`}
            value={draft.placeholder || ""}
            onChange={(e) => upd("placeholder", e.target.value)}
            placeholder="Hint shown inside the input"
          />
        </div>
      </div>

      {/* Row 3: Default Value */}
      {draft.type !== "boolean" && draft.type !== "tags" && (
        <div>
          <label className={FORM_LABEL} htmlFor={`defVal-${draft.key}`}>
            Default Value <span className="normal-case font-normal text-muted-foreground/70">(optional, pre-filled in the form)</span>
          </label>
          <Input
            id={`defVal-${draft.key}`}
            value={(draft.defaultValue as string | number | undefined) || ""}
            onChange={(e) => upd("defaultValue", e.target.value)}
            placeholder="Leave blank for no default"
          />
        </div>
      )}

      {/* Row 4: Type-specific constraints */}
      {hasOptions && (
        <div>
          <label className={FORM_LABEL} htmlFor={`opts-${draft.key}`}>
            {draft.type === "tags" ? "Predefined Tags" : "Options"}{" "}
            <span className="normal-case font-normal text-muted-foreground/70">(comma-separated)</span>
          </label>
          <Input
            id={`opts-${draft.key}`}
            value={draft._optionsString}
            onChange={(e) => upd("_optionsString", e.target.value)}
            placeholder={draft.type === "tags" ? "e.g. Student, Alumni, Donor" : "Option A, Option B, Option C"}
          />
          {draft.type === "tags" && (
            <p className="text-[10px] text-muted-foreground mt-1">Users can also type and add custom tags not in this list.</p>
          )}
        </div>
      )}

      {hasTextLength && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor={`minlen-${draft.key}`}>Min Length</label>
            <Input
              id={`minlen-${draft.key}`}
              type="number"
              min={0}
              value={draft.minLength ?? ""}
              onChange={(e) => upd("minLength", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`maxlen-${draft.key}`}>Max Length</label>
            <Input
              id={`maxlen-${draft.key}`}
              type="number"
              min={1}
              value={draft.maxLength ?? ""}
              onChange={(e) => upd("maxLength", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 100"
            />
          </div>
        </div>
      )}

      {hasNumRange && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor={`min-${draft.key}`}>Min Value</label>
            <Input
              id={`min-${draft.key}`}
              type="number"
              value={draft.min ?? ""}
              onChange={(e) => upd("min", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 0"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`max-${draft.key}`}>Max Value</label>
            <Input
              id={`max-${draft.key}`}
              type="number"
              value={draft.max ?? ""}
              onChange={(e) => upd("max", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 999"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`mask-${draft.key}`}>
              Input Mask <span className="normal-case font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <Input
              id={`mask-${draft.key}`}
              value={draft.mask || ""}
              onChange={(e) => upd("mask", e.target.value)}
              placeholder="e.g. 99999-9999999-9"
            />
          </div>
        </div>
      )}

      {/* Row 5: Flags + action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <Checkbox
            checked={draft.required}
            onCheckedChange={() => upd("required", !draft.required)}
            aria-label="Toggle field required status"
          />
          <span>Required</span>
        </div>
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <Checkbox
            checked={draft.unique}
            onCheckedChange={() => upd("unique", !draft.unique)}
            aria-label="Toggle field uniqueness guard"
          />
          <span>Unique</span>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-3 py-1.5 h-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
          aria-label="Cancel editing"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="flex items-center gap-1.5 px-4 py-1.5 h-8 bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-colors hover:bg-primary/90 shadow-none"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Field</span>
        </Button>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: CustomFieldConfig;
  isDragging: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Single custom field row displayed in the list.
 */
function FieldRow({
  field,
  isDragging,
  dragHandleProps,
  onEdit,
  onDelete,
}: FieldRowProps): React.JSX.Element {
  const [confirming, setConfirming] = useState<boolean>(false);
  const typeLabel = FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type;
  const optionCount = normalizeOptions(field.options).length;

  if (confirming) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 dark:bg-destructive/20 dark:border-destructive/30">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        <p className="flex-1 text-xs text-destructive dark:text-destructive font-medium">
          Delete <strong>{field.label}</strong>? This cannot be undone.
        </p>
        <Button
          type="button"
          onClick={() => setConfirming(false)}
          variant="outline"
          className="px-2.5 py-1 h-8 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            setConfirming(false);
            onDelete();
          }}
          variant="destructive"
          className="px-2.5 py-1 h-8 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors shadow-none"
        >
          Delete
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all
        ${isDragging ? "shadow-lg border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
    >
      {/* Drag handle */}
      <span
        {...(dragHandleProps || {})}
        aria-label="Drag to reorder field"
        className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      {/* Field metadata */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{field.label}</span>
          <span className="text-[11px] text-muted-foreground">{typeLabel}</span>
          {field.required && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/30">
              Required
            </span>
          )}
          {field.unique && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 dark:bg-warning/20 dark:text-warning dark:border-warning/30">
              Unique
            </span>
          )}
          {optionCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              [{optionCount} {field.type === "tags" ? "tags" : "options"}]
            </span>
          )}
          {field.type === "number" && field.mask && (
            <span className="text-[10px] text-muted-foreground font-mono">mask: {field.mask}</span>
          )}
        </div>
        {field.description && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{field.description}</p>}
      </div>

      {/* Actions */}
      <Button
        type="button"
        onClick={onEdit}
        variant="ghost"
        className="p-1.5 h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-none"
        aria-label={`Edit ${field.label}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        onClick={() => setConfirming(true)}
        variant="ghost"
        className="p-1.5 h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shadow-none"
        aria-label={`Delete ${field.label}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

interface CustomFieldsBuilderProps {
  fields?: CustomFieldConfig[];
  droppableId?: string;
  onChange: (fields: CustomFieldConfig[]) => void;
}

/**
 * Full custom fields manager component. Supports add, edit, drag-reorder, and
 * delete (with inline confirmation) of custom fields for a given tab.
 * @param props Component properties.
 * @returns React element.
 */
export function CustomFieldsBuilder({
  fields = [],
  droppableId = "custom-fields",
  onChange
}: CustomFieldsBuilderProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [draft, setDraft] = useState<CustomFieldConfig | null>(null);

  const existingLabels = fields.map((f) => f.label);

  const startAdd = (): void => {
    setAdding(true);
    setEditingId(null);
    setDraft(newField());
  };

  const handleSaveNew = (f: CustomFieldConfig): void => {
    onChange([...fields, f]);
    setAdding(false);
    setDraft(null);
  };

  const handleSaveEdit = (f: CustomFieldConfig): void => {
    onChange(fields.map((x) => (x.key === f.key ? f : x)));
    setEditingId(null);
  };

  const handleDelete = (key: string): void => {
    onChange(fields.filter((f) => f.key !== key));
  };

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(fields);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h4 className="text-sm font-bold text-foreground">Custom Fields</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your own fields. They appear below the built-in fields in this tab.
          </p>
        </div>
        {!adding && (
          <Button
            type="button"
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </Button>
        )}
      </div>

      {/* Field list removed to unify with DraggableFieldList */}

      {/* New field editor */}
      {adding && draft && (
        <FieldEditor
          field={draft}
          existingLabels={existingLabels}
          onSave={handleSaveNew}
          onCancel={() => {
            setAdding(false);
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}
