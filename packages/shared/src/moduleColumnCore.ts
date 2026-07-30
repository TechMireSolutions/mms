import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  type StudentsSettings,
  type TeachersSettings,
} from './settingsTypes.js';

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
  dob: string;
  parents: string;
  sessions: string;
  status: string;
}

/** Builds tenant-default Work column registry for Students (before per-user overlay). */
export function buildStudentWorkColumnRegistry(
  settings: StudentsSettings,
  labels: StudentWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  const fields = (settings.fields ?? DEFAULT_STUDENTS_SETTINGS.fields ?? {}) as Record<string, { enabled?: boolean }>;
  const customFields = settings.customFields ?? [];
  const registryColumns: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.dob?.enabled !== false) {
    registryColumns.push({ key: 'dob', label: labels.dob, enabled: true, order: order++ });
  }

  const parentsEnabled =
    fields.fatherLink?.enabled !== false ||
    fields.motherLink?.enabled !== false ||
    fields.guardianLink?.enabled !== false;
  if (parentsEnabled) {
    registryColumns.push({ key: 'parents', label: labels.parents, enabled: true, order: order++ });
  }

  registryColumns.push({ key: 'sessions', label: labels.sessions, enabled: true, order: order++ });
  registryColumns.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    registryColumns.push({
      key: `custom:${field.id}`,
      label: field.label,
      enabled: true,
      order: order++,
    });
  }

  return registryColumns;
}

export function isModuleColumnVisible(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): boolean {
  const column = registry.find((registryColumn) => registryColumn.key === key);
  return column?.enabled ?? false;
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
  const fields = (settings.fields ?? DEFAULT_TEACHERS_SETTINGS.fields ?? {}) as Record<string, { enabled?: boolean }>;
  const customFields = settings.customFields ?? [];
  const registryColumns: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.specialization?.enabled !== false) {
    registryColumns.push({ key: 'specialization', label: labels.specialization, enabled: true, order: order++ });
  }
  if (fields.qualification?.enabled !== false) {
    registryColumns.push({ key: 'qualification', label: labels.qualification, enabled: true, order: order++ });
  }
  if (fields.joinDate?.enabled !== false) {
    registryColumns.push({ key: 'joinDate', label: labels.joinDate, enabled: true, order: order++ });
  }
  registryColumns.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    registryColumns.push({
      key: `custom:${field.id}`,
      label: field.label ?? field.id,
      enabled: true,
      order: order++,
    });
  }

  return registryColumns;
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
