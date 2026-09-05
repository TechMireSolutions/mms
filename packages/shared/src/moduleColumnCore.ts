import {
  type StudentsSettings,
  type TeachersSettings,
} from './settingsTypes.js';
import type { FieldDefinition } from './contactTypes.js';
import { listEnabledCustomStudentFormFields } from './studentFormCustomFields.js';
import { syncStudentColumnRegistryWithFields } from './studentColumnRegistrySync.js';
import { syncTeacherColumnRegistryWithFields } from './teacherColumnRegistrySync.js';
import {
  listEnabledCustomTeacherFormFields,
  resolveTeacherFieldsMapForColumnSync,
} from './teacherFormCustomFields.js';
import { resolveTeacherEnabledTabIds } from './teacherEnabledTabs.js';
import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  DEFAULT_TEACHER_COLUMN_REGISTRY,
} from './moduleFieldSetupPersons.js';

/** Per-user Work directory column layout (globle1 §3.4). */
export interface ModuleColumnPreference {
  key: string;
  enabled: boolean;
  order: number;
  /** Optional pixel width when the user has resized the column. */
  width?: number;
}

export type ModuleColumnPref = ModuleColumnPreference;

export interface ModuleColumnRegistryEntry extends ModuleColumnPreference {
  label: string;
  fixed?: boolean;
}

export type UserModuleColumnPreferencesMap = Record<string, ModuleColumnPreference[]>;

export const MODULE_COLUMN_WIDTH_MIN = 80;
export const MODULE_COLUMN_WIDTH_MAX = 640;

/** Custom-field key when a Work column key is prefixed with `custom:`, else `null`. */
export function customFieldKeyFromColumnKey(columnKey: string): string | null {
  if (!columnKey.startsWith('custom:')) return null;
  return columnKey.slice('custom:'.length);
}

/** Clamp a user-resized column width to the supported range. */
export function clampModuleColumnWidth(width: number): number {
  if (!Number.isFinite(width)) return MODULE_COLUMN_WIDTH_MIN;
  return Math.min(MODULE_COLUMN_WIDTH_MAX, Math.max(MODULE_COLUMN_WIDTH_MIN, Math.round(width)));
}

export function applyModuleColumnOverlay(
  registry: ModuleColumnRegistryEntry[],
  preferences: ModuleColumnPreference[] | null,
): ModuleColumnRegistryEntry[] {
  if (!preferences?.length) return registry;
  const preferenceByKey = new Map(preferences.map((preference) => [preference.key, preference]));
  return registry.map((column) => {
    const preference = preferenceByKey.get(column.key);
    if (!preference) return column;
    return {
      ...column,
      enabled: column.fixed ? column.enabled : preference.enabled,
      order: preference.order,
      width: preference.width ?? column.width,
    };
  });
}

/**
 * Merge server column prefs with device-local prefs so resized widths are not wiped
 * when the server payload omits `width` (stale GET / older saves).
 * Server wins for enabled/order; width prefers this device's local value, then server.
 */
export function mergeModuleColumnPreferences(
  serverPreferences: ModuleColumnPreference[] | null | undefined,
  localPreferences: ModuleColumnPreference[] | null | undefined,
): ModuleColumnPreference[] | null {
  if (!serverPreferences?.length && !localPreferences?.length) return null;
  if (!serverPreferences?.length) return localPreferences ?? null;
  if (!localPreferences?.length) return serverPreferences;

  const localByKey = new Map(localPreferences.map((preference) => [preference.key, preference]));
  const mergedKeys = new Set<string>();
  const merged: ModuleColumnPreference[] = serverPreferences.map((serverPreference) => {
    mergedKeys.add(serverPreference.key);
    const localPreference = localByKey.get(serverPreference.key);
    const next: ModuleColumnPreference = {
      key: serverPreference.key,
      enabled: serverPreference.enabled,
      order: serverPreference.order,
    };
    const width = localPreference?.width ?? serverPreference.width;
    if (typeof width === 'number') {
      next.width = clampModuleColumnWidth(width);
    }
    return next;
  });

  for (const localPreference of localPreferences) {
    if (mergedKeys.has(localPreference.key)) continue;
    const next: ModuleColumnPreference = {
      key: localPreference.key,
      enabled: localPreference.enabled,
      order: localPreference.order,
    };
    if (typeof localPreference.width === 'number') {
      next.width = clampModuleColumnWidth(localPreference.width);
    }
    merged.push(next);
  }

  return merged;
}

/** Resolve stored pixel width for a Work column key. */
export function getModuleColumnWidth(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): number | undefined {
  const column = registry.find((registryColumn) => registryColumn.key === key);
  return typeof column?.width === 'number' ? column.width : undefined;
}

export interface StudentWorkColumnLabels {
  name: string;
  grNumber: string;
  gender: string;
  phone: string;
  email: string;
  dob: string;
  parents: string;
  status: string;
  registeredDate: string;
  notes: string;
}

/** Builds tenant-default Work column registry for Students (before per-user overlay). */
export function buildStudentWorkColumnRegistry(
  settings: StudentsSettings,
  labels: StudentWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  const fields = (settings.fields ?? {}) as Record<string, FieldDefinition[]>;
  const enabledTabs = Array.isArray(settings.enabledTabs) ? settings.enabledTabs : ['registration'];
  const storedRegistry = Array.isArray(settings.columnRegistry) ? settings.columnRegistry : undefined;
  const synced = syncStudentColumnRegistryWithFields(
    storedRegistry ?? DEFAULT_STUDENT_COLUMN_REGISTRY,
    fields,
    enabledTabs,
  );

  const labelByKey: Record<string, string> = {
    name: labels.name,
    grNumber: labels.grNumber,
    gender: labels.gender,
    phone: labels.phone,
    email: labels.email,
    dob: labels.dob,
    parents: labels.parents,
    status: labels.status,
    registeredDate: labels.registeredDate,
    notes: labels.notes,
  };

  const customByKey = new Map(
    listEnabledCustomStudentFormFields(fields).map((field) => [field.key, field]),
  );

  return synced.map((col) => {
    const customFieldKey = customFieldKeyFromColumnKey(col.key);
    if (customFieldKey !== null) {
      const field = customByKey.get(customFieldKey);
      return {
        key: col.key,
        label: field?.label || col.label,
        enabled: col.enabled !== false,
        order: col.order,
        width: col.width,
        fixed: col.fixed,
      };
    }
    return {
      key: col.key,
      label: labelByKey[col.key] || col.label,
      enabled: col.enabled !== false,
      order: col.order,
      width: col.width,
      fixed: col.fixed || col.key === 'name',
    };
  });
}

export function isModuleColumnVisible(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): boolean {
  const column = registry.find((registryColumn) => registryColumn.key === key);
  return column?.enabled ?? false;
}

/**
 * Visible Work columns in registry order.
 * Pass `excludeFace` to omit card face chrome columns from metadata grids.
 */
export function getVisibleWorkColumns(
  registry: ModuleColumnRegistryEntry[],
  isColumnVisible: (key: string) => boolean,
  options?: { excludeFace?: ReadonlySet<string> },
): ModuleColumnRegistryEntry[] {
  return [...registry]
    .filter((col) => {
      if (!isColumnVisible(col.key)) return false;
      if (options?.excludeFace?.has(col.key)) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

export interface TeacherWorkColumnLabels {
  name: string;
  specialization: string;
  qualification: string;
  joinDate: string;
  status: string;
}

/** Builds tenant-default Work column registry for Teachers (before per-user overlay). */
export function buildTeacherWorkColumnRegistry(
  settings: TeachersSettings,
  labels: TeacherWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  const fields = resolveTeacherFieldsMapForColumnSync(settings.fields);
  const enabledTabs = resolveTeacherEnabledTabIds(settings);
  const synced = syncTeacherColumnRegistryWithFields(
    settings.columnRegistry ?? DEFAULT_TEACHER_COLUMN_REGISTRY,
    fields,
    enabledTabs,
  );

  const labelByKey: Record<string, string> = {
    name: labels.name,
    specialization: labels.specialization,
    qualification: labels.qualification,
    joinDate: labels.joinDate,
    status: labels.status,
  };

  const customByKey = new Map(
    listEnabledCustomTeacherFormFields(fields).map((field) => [field.key, field]),
  );

  return synced.map((col) => {
    const customFieldKey = customFieldKeyFromColumnKey(col.key);
    if (customFieldKey !== null) {
      const field = customByKey.get(customFieldKey);
      return {
        key: col.key,
        label: field?.label || col.label,
        enabled: col.enabled !== false,
        order: col.order,
        width: col.width,
        fixed: col.fixed,
      };
    }
    return {
      key: col.key,
      label: labelByKey[col.key] || col.label,
      enabled: col.enabled !== false,
      order: col.order,
      width: col.width,
      fixed: col.fixed || col.key === 'name',
    };
  });
}

/** Helper to build a standard module column registry array from an ordered list of keys and labels. */
export function createColumnRegistry<T extends object>(
  keys: (keyof T & string)[],
  labels: T,
  fixedFirst = true,
): ModuleColumnRegistryEntry[] {
  return keys.map((key, index) => ({
    key,
    label: String(labels[key as keyof T] ?? ''),
    enabled: true,
    order: index,
    ...(index === 0 && fixedFirst ? { fixed: true } : {}),
  }));
}
