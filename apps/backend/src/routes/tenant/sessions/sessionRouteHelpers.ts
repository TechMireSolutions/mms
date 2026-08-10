import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';

/** Thin Sessions audit helper — shared factory, same shape as Contacts/Teachers. */
export const auditSession = createCollectionAuditHelper('sessions');
