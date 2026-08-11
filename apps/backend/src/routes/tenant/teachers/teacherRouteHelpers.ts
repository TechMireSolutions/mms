import type { Teacher, User } from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { teacherUseCases } from '../../../teachers/use-cases/teacherUseCases.js';

/** Thin Teachers audit helper — same shape as Contacts `auditContact`. */
export const auditTeacher = createCollectionAuditHelper('teachers');

/** Strips teacher properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeTeachersForUser(teachers: Teacher[], user: User): Promise<Teacher[]> {
  return teacherUseCases.sanitizeTeachersForViewer(teachers, user.role);
}

export async function sanitizeOneTeacherForUser(teacher: Teacher, user: User): Promise<Teacher> {
  return teacherUseCases.sanitizeTeacherForViewer(teacher, user.role);
}
