import type { User } from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';

/** Thin Sessions audit helper — same shape as Teachers `auditTeacher`. */
export async function auditSession(
  user: User,
  action: string,
  summary: string,
  entityId = 'sessions',
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
