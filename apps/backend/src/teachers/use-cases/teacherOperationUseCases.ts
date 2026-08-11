import {
  computeNextTeacherEmployeeIdFromCount,
  type TeacherEmployeeIdSettings,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { broadcastCollection } from '../../services/websocketService.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';

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

/** Next employee id from active roster count + tenant settings (Students GR-count parity). */
export async function computeNextTeacherEmployeeIdForSettings(
  settings: TeacherEmployeeIdSettings,
  repo: TeachersRepository = teachersRepository,
): Promise<string> {
  const tenant = getRequestTenant();
  const count = tenant ? await repo.countNextEmployeeId(tenant) : 0;
  return computeNextTeacherEmployeeIdFromCount(count, settings);
}
