import {
  computeNextGrNumber,
  normalizeStudentModulePreferences,
  todayISO,
  type StudentDuplicateCheckInput,
  type StudentGrNumberSettings,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { loadStudentModulePreferences } from '../../services/studentPreferencesService.js';
import { broadcastCollection } from '../../services/websocketService.js';
import type { StudentsRepository } from '../repository/studentsRepository.js';
import { studentsRepository } from '../repository/studentsRepositoryAdapter.js';
import { throwGrUniqueConflict } from './studentNormalizeUseCases.js';

export async function computeNextGrNumberForDate(
  regDate: string,
  settings: StudentGrNumberSettings,
  repo: StudentsRepository = studentsRepository,
): Promise<string> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return computeNextGrNumber([], settings, regDate);
  }
  const restartAnnually = settings.grNumberRestartAnnually !== false;
  const count = await repo.countNextGrNumber(tenant, { regDate, restartAnnually });
  const template = settings.grNumberTemplate || '{seq}-{year}';
  const digits = settings.grNumberDigits || 4;
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  const seqStr = String(count + 1).padStart(digits, '0');
  return template.replace('{seq}', seqStr).replace('{year}', String(year));
}

export async function checkStudentRegistrationDuplicate(
  input: StudentDuplicateCheckInput,
  repo: StudentsRepository = studentsRepository,
): Promise<{ reason: 'contact' | 'email' | 'nameDob' | 'grNumber' | null }> {
  const tenant = getRequestTenant();
  if (!tenant) return { reason: null };
  const reason = await repo.findRegistrationConflict(tenant, input);
  return { reason };
}

export async function bulkUpdateStudentStatus(
  ids: string[],
  status: string,
  repo: StudentsRepository = studentsRepository,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await repo.bulkUpdateStatusSql(tenant, uniqueIds, status);
  if (succeeded > 0) {
    await broadcastCollection('students');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}

/** One-shot backfill of missing GR numbers for active students (Setup writers). */
export async function migrateStudentsMissingGrNumbers(
  repo: StudentsRepository = studentsRepository,
): Promise<{ updated: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { updated: 0 };

  const settings = normalizeStudentModulePreferences(await loadStudentModulePreferences());
  const missing = await repo.listActiveMissingGrNumber(tenant);
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
    const grNumber = await computeNextGrNumberForDate(registeredDate, prefs, repo);
    try {
      await repo.save(tenant, { ...row, grNumber });
    } catch (error: unknown) {
      throwGrUniqueConflict(error);
    }
    updated += 1;
  }

  await broadcastCollection('students');
  return { updated };
}
