import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';

/** Thin Enrollments audit helper — shared factory, same shape as Contacts/Teachers. */
export const auditEnrollment = createCollectionAuditHelper('enrollments');
