import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';

/** Thin Teachers audit helper — same shape as Contacts `auditContact`. */
export const auditTeacher = createCollectionAuditHelper('teachers');
