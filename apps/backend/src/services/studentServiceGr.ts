import {
  computeNextGrNumber,
  normalizeStudentModulePreferences,
  todayISO,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
} from '@mms/shared';
import { saveStudent } from '../db/repositories/studentRepository.js';
import { listActiveStudentsMissingGrNumber } from '../db/repositories/studentRepositoryList.js';
import {
  countStudentsForNextGrNumber,
  findStudentRegistrationConflictSql,
} from '../db/repositories/studentRepositoryWidgets.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { loadStudentModulePreferences } from './studentPreferencesService.js';
import { throwGrUniqueConflict } from './studentServiceMutate.js';
import { broadcastCollection } from './websocketService.js';

export async function computeNextGrNumberForDate(regDate: string, settings: StudentGrNumberSettings) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return computeNextGrNumber([], settings, regDate);
  }
  const restartAnnually = settings.grNumberRestartAnnually !== false;
  const count = await countStudentsForNextGrNumber(tenant, regDate, restartAnnually);
  const template = settings.grNumberTemplate || '{seq}-{year}';
  const digits = settings.grNumberDigits || 4;
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  const seqStr = String(count + 1).padStart(digits, '0');
  return template.replace('{seq}', seqStr).replace('{year}', String(year));
}

export async function checkStudentRegistrationDuplicate(input: StudentDuplicateCheckInput) {
  const tenant = getRequestTenant();
  if (!tenant) return { reason: null };
  const reason = await findStudentRegistrationConflictSql(tenant, input);
  return { reason };
}

/** One-shot backfill of missing GR numbers for active students (Setup writers). */
export async function migrateStudentsMissingGrNumbers(): Promise<{ updated: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { updated: 0 };

  const settings = normalizeStudentModulePreferences(await loadStudentModulePreferences());
  const missing = await listActiveStudentsMissingGrNumber(tenant);
  if (missing.length === 0) return { updated: 0 };

  const fallbackDate = todayISO();
  const prefs = {
    grNumberTemplate: settings.grNumberTemplate,
    grNumberDigits: settings.grNumberDigits,
    grNumberRestartAnnually: settings.grNumberRestartAnnually,
  };
  let updated = 0;
  for (const row of missing) {
    const registeredDate =
      typeof row.registeredDate === 'string' && row.registeredDate.trim()
        ? row.registeredDate
        : fallbackDate;
    // Persist each row before the next count so SQL next-GR stays monotonic.
    const grNumber = await computeNextGrNumberForDate(registeredDate, prefs);
    try {
      await saveStudent(tenant, { ...row, grNumber });
    } catch (error: unknown) {
      throwGrUniqueConflict(error);
    }
    updated += 1;
  }

  await broadcastCollection('students');
  return { updated };
}
