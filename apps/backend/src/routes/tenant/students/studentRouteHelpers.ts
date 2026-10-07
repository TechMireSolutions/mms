import type { Student, User } from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';
import { StudentPermissionError } from '../../../students/use-cases/studentNormalizeUseCases.js';

/** Thin Students audit helper — shared factory, same shape as Contacts/Faculty. */
export const auditStudent = createCollectionAuditHelper('students');

/** Strips student properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeStudentsForUser(students: Student[], user: User): Promise<Student[]> {
  return studentUseCases.sanitizeStudentsForViewer(students, user.role);
}

export async function sanitizeOneStudentForUser(student: Student, user: User): Promise<Student> {
  return studentUseCases.sanitizeStudentForViewer(student, user.role);
}

type StudentWriteErrorBody =
  | { type: string; message: string }
  | { type: string; message: string; errors: Array<{ field: string; message: string }> };

/** Maps create/update domain errors to ts-rest status/body (403 / 400 / 409). */
export function mapStudentWriteHttpError(
  error: unknown,
): { status: 403 | 400 | 409; body: StudentWriteErrorBody } | null {
  if (error instanceof StudentPermissionError) {
    return { status: 403, body: { type: 'forbidden', message: error.message } };
  }
  if (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
    (error as { statusCode: number }).statusCode === 409
  ) {
    const type =
      'type' in error && typeof (error as { type?: unknown }).type === 'string'
        ? (error as { type: string }).type
        : 'conflict';
    return { status: 409, body: { type, message: error.message } };
  }
  if (error && typeof error === 'object' && 'type' in error && 'field' in error) {
    const e = error as { type: string; message: string; field: string };
    return {
      status: 400,
      body: {
        type: e.type,
        message: e.message,
        errors: [{ field: e.field, message: e.message }],
      },
    };
  }
  return null;
}
