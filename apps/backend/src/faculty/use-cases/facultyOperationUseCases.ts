import {
  formatTeacherEmployeeId,
  DEFAULT_TEACHERS_SETTINGS,
  normalizeTeacherModulePreferences,
  type TeacherDuplicateCheckInput,
  type TeacherEmployeeIdSettings,
  type TeacherDuplicateReason,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { loadTeacherModulePreferences } from './facultyPreferencesService.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository as TeachersRepository } from '../repository/facultyRepository.js';
import { facultyRepository as teachersRepository } from '../repository/facultyRepositoryAdapter.js';

/** Active duplicate probe (contact / employeeId) before save — server authoritative. */
export async function checkTeacherRegistrationDuplicate(
  input: TeacherDuplicateCheckInput,
  repo: TeachersRepository = teachersRepository,
): Promise<{ reason: TeacherDuplicateReason | null }> {
  const tenant = getRequestTenant();
  if (!tenant) return { reason: null };
  const reason = await repo.findRegistrationConflict(tenant, input);
  return { reason };
}

export async function bulkUpdateTeacherStatus(
  ids: string[],
  status: string,
  repo: TeachersRepository = teachersRepository,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await repo.bulkUpdateStatusSql(tenant, uniqueIds, status);
  if (succeeded > 0) {
    await broadcastCollection('teachers');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}

export async function bulkUpdateTeacherSpecialization(
  ids: string[],
  specialization: string,
  repo: TeachersRepository = teachersRepository,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await repo.bulkUpdateSpecializationSql(tenant, uniqueIds, specialization);
  if (succeeded > 0) {
    await broadcastCollection('teachers');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}

/** Next employee id from sequence watermark + dynamic tenant settings + collision probing. */
export async function computeNextTeacherEmployeeIdForSettings(
  settingsInput?: Partial<TeacherEmployeeIdSettings>,
  repo: TeachersRepository = teachersRepository,
): Promise<string> {
  const tenant = getRequestTenant();
  const savedPrefs = tenant
    ? normalizeTeacherModulePreferences(await loadTeacherModulePreferences())
    : DEFAULT_TEACHERS_SETTINGS;

  const settings: TeacherEmployeeIdSettings = {
    idPrefix:
      settingsInput?.idPrefix?.trim() ||
      savedPrefs.idPrefix ||
      DEFAULT_TEACHERS_SETTINGS.idPrefix,
    idTemplate:
      settingsInput?.idTemplate?.trim() ||
      savedPrefs.idTemplate ||
      DEFAULT_TEACHERS_SETTINGS.idTemplate,
    idDigits:
      settingsInput?.idDigits ??
      savedPrefs.idDigits ??
      DEFAULT_TEACHERS_SETTINGS.idDigits,
    idStartSeq:
      settingsInput?.idStartSeq ??
      savedPrefs.idStartSeq ??
      DEFAULT_TEACHERS_SETTINGS.idStartSeq,
    idRestartAnnually:
      settingsInput?.idRestartAnnually ??
      savedPrefs.idRestartAnnually ??
      DEFAULT_TEACHERS_SETTINGS.idRestartAnnually,
  };

  const now = new Date();
  const year = now.getFullYear();
  const count = tenant
    ? await repo.countNextEmployeeId(tenant, {
        prefix: settings.idPrefix,
        restartAnnually: settings.idRestartAnnually,
        year,
      })
    : 0;

  const startSeq =
    Number.isFinite(settings.idStartSeq) && Number(settings.idStartSeq) > 1
      ? Math.floor(Number(settings.idStartSeq))
      : 1;

  let candidateSeq = Math.max(count + 1, startSeq);
  let candidateId = formatTeacherEmployeeId(candidateSeq, settings, now);

  if (tenant) {
    let attempts = 0;
    while (attempts < 100) {
      const conflict = await repo.findRegistrationConflict(tenant, { employeeId: candidateId });
      if (conflict !== 'employeeId') break;
      candidateSeq += 1;
      candidateId = formatTeacherEmployeeId(candidateSeq, settings, now);
      attempts += 1;
    }
  }

  return candidateId;
}

/** One-shot backfill of missing employee ids for active teachers (Setup writers). */
export async function migrateTeachersMissingEmployeeIds(
  repo: TeachersRepository = teachersRepository,
): Promise<{ updated: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { updated: 0 };

  const settings = normalizeTeacherModulePreferences(await loadTeacherModulePreferences());
  const missing = await repo.listActiveMissingEmployeeId(tenant);
  if (missing.length === 0) return { updated: 0 };

  let updated = 0;
  for (const row of missing) {
    // Persist each row before the next count so SQL next-employee-id stays monotonic.
    const employeeId = await computeNextTeacherEmployeeIdForSettings(
      { idPrefix: settings.idPrefix },
      repo,
    );
    await repo.save(tenant, { ...row, employeeId });
    updated += 1;
  }

  await broadcastCollection('teachers');
  return { updated };
}

export const checkFacultyRegistrationDuplicate = checkTeacherRegistrationDuplicate;
export const bulkUpdateFacultyStatus = bulkUpdateTeacherStatus;
export const bulkUpdateFacultySpecialization = bulkUpdateTeacherSpecialization;
export const computeNextFacultyEmployeeIdForSettings = computeNextTeacherEmployeeIdForSettings;
export const migrateFacultyMissingEmployeeIds = migrateTeachersMissingEmployeeIds;

