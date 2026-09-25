import type { TeacherRecord } from '@mms/shared';
import { saveFacultyDesignationAssignment } from '../../db/repositories/facultyDesignationRepository.js';
import { prepareTeacherRecord } from './facultyNormalizeUseCases.js';

/**
 * M-4: Extracted from `createTeacher` — handles the implicit restore path when
 * an incoming `contactId` matches a soft-deleted faculty row.
 *
 * Returns the merged + persisted record (already saved via `repo.save`).
 */
export async function handleImplicitRestore(
  tenant: string,
  archived: TeacherRecord,
  normalized: TeacherRecord,
  rawRecord: Record<string, unknown>,
  save: (tenant: string, record: TeacherRecord) => Promise<void>,
): Promise<TeacherRecord> {
  const merged = prepareTeacherRecord({
    ...archived,
    ...normalized,
    id: archived.id,
  });
  await save(tenant, merged);

  const restoredDesignationId = typeof rawRecord.designationId === 'string' ? rawRecord.designationId.trim() : '';
  const restoredStartsOn = typeof rawRecord.designationStartsOn === 'string'
    ? rawRecord.designationStartsOn
    : new Date().toISOString().slice(0, 10);
  if (restoredDesignationId) {
    try {
      await saveFacultyDesignationAssignment(tenant, {
        id: `fda-${String(merged.id)}`,
        facultyId: String(merged.id),
        designationId: restoredDesignationId,
        startsOn: restoredStartsOn,
        endsOn: null,
        notes: null,
      });
    } catch {
      // Non-fatal: overlap with existing assignment — skip silently.
    }
  }
  return merged;
}

/**
 * M-4: Extracted from `createTeacher` — saves the initial designation assignment
 * after a fresh faculty record has been persisted.
 */
export async function saveDesignationOnCreate(
  tenant: string,
  normalized: TeacherRecord,
  rawRecord: Record<string, unknown>,
): Promise<void> {
  const designationId = typeof rawRecord.designationId === 'string' ? rawRecord.designationId.trim() : '';
  if (!designationId) return;

  const designationStartsOn = typeof rawRecord.designationStartsOn === 'string'
    ? rawRecord.designationStartsOn
    : typeof normalized.joinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized.joinDate)
      ? normalized.joinDate
      : new Date().toISOString().slice(0, 10);

  await saveFacultyDesignationAssignment(tenant, {
    id: `fda-${String(normalized.id)}`,
    facultyId: String(normalized.id),
    designationId,
    startsOn: designationStartsOn,
    endsOn: null,
    notes: null,
  });
}
