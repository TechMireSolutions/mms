import type { User } from '@mms/shared';
import { recordAudit } from '../services/auditService.js';

/**
 * Shared collection-audit helper factory. Module route helpers (Teachers/Students/Users/
 * Sessions/Contacts/Enrollments) each reduce to `createCollectionAuditHelper('teachers')`.
 */
export function createCollectionAuditHelper(defaultEntityId: string) {
  return async function auditCollectionAction(
    user: User,
    action: string,
    summary: string,
    entityId = defaultEntityId,
  ): Promise<void> {
    await recordAudit({
      userId: user.id,
      userEmail: user.email,
      action,
      entityType: 'collection',
      entityId,
      summary,
    });
  };
}
