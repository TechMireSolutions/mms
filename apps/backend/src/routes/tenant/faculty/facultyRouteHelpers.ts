import type { Teacher, User } from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { facultyUseCases } from '../../../faculty/use-cases/facultyUseCases.js';

/** Thin Faculty audit helper — same shape as Contacts `auditContact`. */
export const auditFaculty = createCollectionAuditHelper('faculty');
export const auditTeacher = auditFaculty;

/** Strips faculty properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeFacultyForUser(facultyList: Teacher[], user: User): Promise<Teacher[]> {
  return facultyUseCases.sanitizeTeachersForViewer(facultyList, user.role);
}
export const sanitizeTeachersForUser = sanitizeFacultyForUser;

export async function sanitizeOneFacultyForUser(facultyMember: Teacher, user: User): Promise<Teacher> {
  return facultyUseCases.sanitizeTeacherForViewer(facultyMember, user.role);
}
export const sanitizeOneTeacherForUser = sanitizeOneFacultyForUser;
