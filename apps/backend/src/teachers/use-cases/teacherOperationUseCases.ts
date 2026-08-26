import {
  computeNextTeacherEmployeeIdFromCount,
  normalizeTeacherModulePreferences,
  type TeacherDuplicateCheckInput,
  type TeacherEmployeeIdSettings,
  type TeacherDuplicateReason,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { loadTeacherModulePreferences } from './teacherPreferencesService.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';

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

/** Next employee id from active roster count + tenant settings (Students GR-count parity). */
export async function computeNextTeacherEmployeeIdForSettings(
  settings: TeacherEmployeeIdSettings,
  repo: TeachersRepository = teachersRepository,
): Promise<string> {
  const tenant = getRequestTenant();
  const count = tenant ? await repo.countNextEmployeeId(tenant) : 0;
  return computeNextTeacherEmployeeIdFromCount(count, settings);
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
