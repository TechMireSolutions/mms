import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { Teacher } from './teacherTypes.js';
import type { TeachersSettings } from './teachersModuleSettings.js';

export interface TeachersFieldConfigSnapshot {
  fields: Record<string, FieldDefinition[]>;
  tabs: TabDefinition[];
}

/**
 * Core teacher identity that stays visible regardless of the Setup field
 * registry (Work list + drawer must not break for restricted viewers).
 */
const TEACHER_ALWAYS_VISIBLE = new Set([
  'id',
  'contactId',
  'name',
  'employeeId',
  'status',
  'deletedAt',
  'deletedBy',
  'deletionReason',
]);

function isTabKeyedFieldRegistry(
  fields: TeachersSettings['fields'],
): fields is Record<string, FieldDefinition[]> {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return false;
  const first = Object.values(fields)[0];
  return Array.isArray(first);
}

/**
 * Resolves teacher field keys that the viewer role cannot read.
 * Precomputed once per batch to avoid O(N * T * F) iterations and repeated tab finds.
 */
export function resolveTeacherKeysToStripForViewer(
  viewerRole: string,
  config: TeachersFieldConfigSnapshot,
): string[] {
  if (!config?.fields || !isTabKeyedFieldRegistry(config.fields)) return [];
  const tabMap = new Map<string, TabDefinition>();
  for (const candidate of config.tabs ?? []) {
    if (candidate.key) {
      tabMap.set(candidate.key.toLowerCase(), candidate);
    }
  }

  const toStrip: string[] = [];
  for (const [tabId, tabFields] of Object.entries(config.fields)) {
    const tab = tabMap.get(tabId.toLowerCase());
    const tabVisible = tab ? canViewContactTab(viewerRole, tab) : true;
    for (const field of tabFields) {
      if (TEACHER_ALWAYS_VISIBLE.has(field.key)) continue;
      if (!tabVisible || field.enabled === false || !canViewContactField(viewerRole, field)) {
        toStrip.push(field.key);
      }
    }
  }
  return toStrip;
}

/**
 * Strips teacher properties the viewer role cannot read (API + restore guard).
 * Mirrors `sanitizeStudentForViewer`: disabled or role-hidden Setup fields are
 * removed; always-visible identity keys and unregistered custom keys survive.
 */
export function sanitizeTeacherForViewer(
  teacher: Teacher,
  viewerRole: string,
  config: TeachersFieldConfigSnapshot,
): Teacher {
  const keysToStrip = resolveTeacherKeysToStripForViewer(viewerRole, config);
  if (keysToStrip.length === 0) return teacher;
  const sanitized: Teacher = { ...teacher };
  for (const key of keysToStrip) {
    delete sanitized[key];
  }
  return sanitized;
}

export function sanitizeTeachersForViewer(
  teachers: Teacher[],
  viewerRole: string,
  config: TeachersFieldConfigSnapshot,
): Teacher[] {
  const keysToStrip = resolveTeacherKeysToStripForViewer(viewerRole, config);
  if (keysToStrip.length === 0) return teachers;
  return teachers.map((teacher) => {
    const sanitized: Teacher = { ...teacher };
    for (const key of keysToStrip) {
      delete sanitized[key];
    }
    return sanitized;
  });
}
