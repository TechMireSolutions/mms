import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';

/** Thin Students audit helper — shared factory, same shape as Contacts/Teachers. */
export const auditStudent = createCollectionAuditHelper('students');
