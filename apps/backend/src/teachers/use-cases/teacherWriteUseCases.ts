import type { TeacherRecord } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../services/websocketService.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';
import { prepareTeacherRecord } from './teacherNormalizeUseCases.js';

export interface CreateTeacherResult {
  record: TeacherRecord;
  /** True when an archived teacher with the same contactId was restored instead of inserting. */
  restored: boolean;
}

/**
 * Creates a teacher. When the incoming record carries a `contactId` that matches a
 * soft-deleted teacher (re-registration), the archived row is restored in place —
 * its id/createdAt are preserved, deletion markers cleared, and incoming fields
 * overlaid (Contacts/Students restore-on-create parity).
 */
export async function createTeacher(
  record: TeacherRecord,
  repo: TeachersRepository = teachersRepository,
): Promise<CreateTeacherResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const normalized = prepareTeacherRecord(record);
    const contactId = normalized.contactId != null ? String(normalized.contactId).trim() : '';

    if (contactId) {
      const archived = await repo.findSoftDeletedByContactId(tenant, contactId);
      if (archived) {
        const merged = prepareTeacherRecord({
          ...archived,
          ...normalized,
          id: archived.id,
        });
        await repo.save(tenant, merged);
        return { record: merged, restored: true };
      }
    }

    await repo.save(tenant, normalized);
    return { record: normalized, restored: false };
  });
  await broadcastCollection('teachers');
  return result;
}

export async function updateTeacherById(
  id: string,
  record: TeacherRecord,
  repo: TeachersRepository = teachersRepository,
): Promise<TeacherRecord | null> {
  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return null;
    const normalized = prepareTeacherRecord({ ...record, id });
    await repo.save(tenant, normalized);
    return normalized;
  });
  if (saved) await broadcastCollection('teachers');
  return saved;
}
