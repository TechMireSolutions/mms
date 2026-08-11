import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { Student } from './studentTypes.js';
import type { StudentsSettings } from './studentsModuleSettings.js';

export interface StudentsFieldConfigSnapshot {
  fields: Record<string, FieldDefinition[]>;
  tabs: TabDefinition[];
}

/**
 * Core student identity that stays visible regardless of the Setup field
 * registry (Work list + drawer must not break for restricted viewers).
 */
const STUDENT_ALWAYS_VISIBLE = new Set([
  'id',
  'contactId',
  'name',
  'grNumber',
  'studentId',
  'status',
  'deletedAt',
  'deletedBy',
  'deletionReason',
]);

function isTabKeyedFieldRegistry(
  fields: StudentsSettings['fields'],
): fields is Record<string, FieldDefinition[]> {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return false;
  const first = Object.values(fields)[0];
  return Array.isArray(first);
}

/**
 * Strips student properties the viewer role cannot read (API + restore guard).
 * Mirrors `sanitizeContactForViewer`: disabled or role-hidden Setup fields are
 * removed; always-visible identity keys and unregistered custom keys survive.
 */
export function sanitizeStudentForViewer(
  student: Student,
  viewerRole: string,
  config: StudentsFieldConfigSnapshot,
): Student {
  if (!config?.fields || !isTabKeyedFieldRegistry(config.fields)) return student;
  const sanitized: Student = { ...student };
  const { fields, tabs } = config;

  for (const [tabId, tabFields] of Object.entries(fields)) {
    const tab = tabs.find((candidate) => (candidate.key || '').toLowerCase() === tabId.toLowerCase());
    const tabVisible = tab ? canViewContactTab(viewerRole, tab) : true;
    for (const field of tabFields) {
      if (STUDENT_ALWAYS_VISIBLE.has(field.key)) continue;
      if (!tabVisible || field.enabled === false || !canViewContactField(viewerRole, field)) {
        delete sanitized[field.key];
      }
    }
  }

  return sanitized;
}

export function sanitizeStudentsForViewer(
  students: Student[],
  viewerRole: string,
  config: StudentsFieldConfigSnapshot,
): Student[] {
  return students.map((student) => sanitizeStudentForViewer(student, viewerRole, config));
}
