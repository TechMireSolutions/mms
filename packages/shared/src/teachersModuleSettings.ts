import type { TabDefinition, ColumnRegistryEntry, FieldDefinition } from "./contactTypes.js";
import { INITIAL_TEACHERS_FIELD_SEED } from "./moduleFieldSetupPersons.js";
import { DEFAULT_TEACHER_SPECIALIZATION } from "./teacherTypes.js";
import { teacherFieldLabelKey } from "./teacherDirectoryColumns.js";
import {
  cloneTeacherFieldSeed,
  listEnabledCustomTeacherFormFields,
  listTeacherSystemFormFieldKeys,
  resolveTeacherFieldsMapForColumnSync,
} from "./teacherFormCustomFields.js";

// ─── Teachers Module Settings ─────────────────────────────────────────────────

export interface TeacherFieldConfig {
  enabled?: boolean;
  required?: boolean;
}

/** Legacy compat shape — read-only bridge; tabbed `fields` is the write SSOT. */
export interface TeacherCustomField {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Teachers module.
 * Field registry + prefs live on typed `teacher_field_configs` / `teacher_module_preferences`.
 * Work directory view uses `useWorkDirectoryViewMode`.
 * `fields` is a tabbed `Record<tabId, FieldDefinition[]>` (flat legacy blobs still accepted on read).
 */
export interface TeachersSettings {
  idPrefix: string;
  autoGenerateId: boolean;
  requireContactLink: boolean;
  defaultSpecialization: string;
  fields?: Record<string, unknown>;
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
}

function defaultTeacherFieldOrderFromSeed(): string[] {
  return Object.values(INITIAL_TEACHERS_FIELD_SEED).flatMap((tabFields) =>
    [...tabFields]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((field) => field.key),
  );
}

function teacherFieldDefFromDefinition(field: FieldDefinition, isCustom: boolean): TeacherFieldDef {
  return {
    id: field.key,
    labelKey: field.labelKey ?? teacherFieldLabelKey(field.key),
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    options: field.options,
    enabled: field.enabled !== false,
    isCustom,
  };
}

/** Authoritative default values for TeachersSettings (tabbed Fields SSOT). */
export const DEFAULT_TEACHERS_SETTINGS: TeachersSettings = {
  idPrefix: "TCH",
  autoGenerateId: true,
  requireContactLink: true,
  defaultSpecialization: DEFAULT_TEACHER_SPECIALIZATION,
  fields: cloneTeacherFieldSeed(),
  fieldOrder: defaultTeacherFieldOrderFromSeed(),
};

export interface TeacherFieldDef {
  id: string;
  labelKey?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  isCustom?: boolean;
}

const seedFieldsByKey = new Map(
  Object.values(INITIAL_TEACHERS_FIELD_SEED)
    .flat()
    .map((field) => [field.key, field]),
);

/** Seed system field defs in seed order (from tabbed {@link INITIAL_TEACHERS_FIELD_SEED}). */
export const DEFAULT_TEACHER_FIELD_DEFS: TeacherFieldDef[] = defaultTeacherFieldOrderFromSeed().map(
  (fieldId) => {
    const field = seedFieldsByKey.get(fieldId);
    if (!field) {
      throw new Error(`Teachers seed missing system field: ${fieldId}`);
    }
    return teacherFieldDefFromDefinition(field, false);
  },
);

/**
 * Returns sorted teacher field definitions (system + custom) from tabbed `fields` only.
 */
export function getSortedTeacherFields(
  fieldOrder?: string[],
  fieldsRaw?: unknown,
): TeacherFieldDef[] {
  const tabbed = resolveTeacherFieldsMapForColumnSync(
    fieldsRaw && typeof fieldsRaw === "object" && !Array.isArray(fieldsRaw)
      ? (fieldsRaw as Record<string, unknown>)
      : undefined,
  );
  const systemKeys = listTeacherSystemFormFieldKeys();
  const seenKeys = new Set<string>();
  const fieldDefinitions: TeacherFieldDef[] = [];

  for (const tabFields of Object.values(tabbed)) {
    for (const field of tabFields) {
      if (systemKeys.has(field.key) && !seenKeys.has(field.key)) {
        seenKeys.add(field.key);
        fieldDefinitions.push(teacherFieldDefFromDefinition(field, false));
      }
    }
  }

  for (const field of listEnabledCustomTeacherFormFields(tabbed)) {
    if (!seenKeys.has(field.key)) {
      seenKeys.add(field.key);
      fieldDefinitions.push(teacherFieldDefFromDefinition(field, true));
    }
  }

  const order = fieldOrder || DEFAULT_TEACHERS_SETTINGS.fieldOrder || [];
  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
  return fieldDefinitions.sort((left, right) => {
    const leftIndex = orderIndexByFieldId[left.id] ?? 9999;
    const rightIndex = orderIndexByFieldId[right.id] ?? 9999;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.id.localeCompare(right.id);
  });
}

