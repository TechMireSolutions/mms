import type { User } from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';

/** Thin Students audit helper — same shape as Contacts `auditContact`. */
export async function auditStudent(
  user: User,
  action: string,
  summary: string,
  entityId = 'students',
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
