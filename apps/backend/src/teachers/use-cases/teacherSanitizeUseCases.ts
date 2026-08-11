import {
  sanitizeTeacherForViewer as sanitizeTeacherRecord,
  sanitizeTeachersForViewer as sanitizeTeacherRecords,
  type FieldDefinition,
  type Teacher,
  type TeachersSettings,
} from '@mms/shared';
import { loadTeacherFieldConfig } from '../../services/teacherConfigService.js';

function settingsSnapshot(settings: TeachersSettings | null) {
  if (!settings) return null;
  const fields =
    settings.fields && typeof settings.fields === 'object' && !Array.isArray(settings.fields)
      ? (settings.fields as Record<string, FieldDefinition[]>)
      : undefined;
  if (!fields) return null;
  return {
    fields,
    tabs: settings.formTabs ?? [],
  };
}

/** Strips teacher properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeTeacherForViewer(
  teacher: Teacher,
  viewerRole: string,
): Promise<Teacher> {
  const config = settingsSnapshot(await loadTeacherFieldConfig());
  if (!config) return teacher;
  return sanitizeTeacherRecord(teacher, viewerRole, config);
}

export async function sanitizeTeachersForViewer(
  teachers: Teacher[],
  viewerRole: string,
): Promise<Teacher[]> {
  const config = settingsSnapshot(await loadTeacherFieldConfig());
  if (!config) return teachers;
  return sanitizeTeacherRecords(teachers, viewerRole, config);
}
