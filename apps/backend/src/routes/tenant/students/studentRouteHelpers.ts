import type { Student, User } from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';

/** Thin Students audit helper — shared factory, same shape as Contacts/Teachers. */
export const auditStudent = createCollectionAuditHelper('students');

/** Strips student properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeStudentsForUser(students: Student[], user: User): Promise<Student[]> {
  return studentUseCases.sanitizeStudentsForViewer(students, user.role);
}

export async function sanitizeOneStudentForUser(student: Student, user: User): Promise<Student> {
  return studentUseCases.sanitizeStudentForViewer(student, user.role);
}
