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
 * Strips teacher properties the viewer role cannot read (API + restore guard).
 * Mirrors `sanitizeStudentForViewer`: disabled or role-hidden Setup fields are
 * removed; always-visible identity keys and unregistered custom keys survive.
 */
export function sanitizeTeacherForViewer(
  teacher: Teacher,
  viewerRole: string,
  config: TeachersFieldConfigSnapshot,
): Teacher {
  if (!config?.fields || !isTabKeyedFieldRegistry(config.fields)) return teacher;
  const sanitized: Teacher = { ...teacher };
  const { fields, tabs } = config;

  for (const [tabId, tabFields] of Object.entries(fields)) {
    const tab = tabs.find((candidate) => (candidate.key || '').toLowerCase() === tabId.toLowerCase());
    const tabVisible = tab ? canViewContactTab(viewerRole, tab) : true;
    for (const field of tabFields) {
      if (TEACHER_ALWAYS_VISIBLE.has(field.key)) continue;
      if (!tabVisible || field.enabled === false || !canViewContactField(viewerRole, field)) {
        delete sanitized[field.key];
      }
    }
  }

  return sanitized;
}

export function sanitizeTeachersForViewer(
  teachers: Teacher[],
  viewerRole: string,
  config: TeachersFieldConfigSnapshot,
): Teacher[] {
  return teachers.map((teacher) => sanitizeTeacherForViewer(teacher, viewerRole, config));
}
