import type { User } from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';

/** Thin Users audit helper — same shape as Teachers `auditTeacher`. */
export async function auditUser(
  user: User,
  action: string,
  summary: string,
  entityId = 'users',
): Promise<void> {
  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action,
    entityType: 'collection',
    entityId,
    summary,
  });
}
