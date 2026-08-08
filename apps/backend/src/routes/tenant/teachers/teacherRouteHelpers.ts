import type { User } from '@mms/shared';
import { recordAudit } from '../../../services/auditService.js';

/** Thin Teachers audit helper — same shape as Contacts `auditContact`. */
export async function auditTeacher(
  user: User,
  action: string,
  summary: string,
  entityId = 'teachers',
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
