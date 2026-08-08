import type { User } from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';

/** Thin Enrollments audit helper — same shape as Sessions `auditSession`. */
export async function auditEnrollment(
  user: User,
  action: string,
  summary: string,
  entityId = 'enrollments',
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
