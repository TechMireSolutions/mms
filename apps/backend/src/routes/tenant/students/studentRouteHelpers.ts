import type { Student, User } from '@mms/shared';
import {
  buildStudentWriteSchema,
  collectStudentWriteExtraFieldKeys,
} from '@mms/shared';
import type { ZodType } from 'zod';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { loadStudentFieldConfig } from '../../../services/studentConfigService.js';
import { parseRequest } from '../../../lib/zodRequest.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';

/** Thin Students audit helper — shared factory, same shape as Contacts/Teachers. */
export const auditStudent = createCollectionAuditHelper('students');

type StudentWriteZod = ZodType<unknown>;

/** Tenant write schema: system keys ∪ enabled Setup custom field keys (strict). */
export async function loadStudentWriteSchema(): Promise<StudentWriteZod> {
  const fieldConfig = await loadStudentFieldConfig();
  return buildStudentWriteSchema(collectStudentWriteExtraFieldKeys(fieldConfig));
}

export async function parseStudentWriteBody(
  body: unknown,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const schema = await loadStudentWriteSchema();
  const parsed = parseRequest(schema, body);
  if (!parsed.ok) return parsed;
  return { ok: true, data: parsed.data as Record<string, unknown> };
}

/** Strips student properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeStudentsForUser(students: Student[], user: User): Promise<Student[]> {
  return studentUseCases.sanitizeStudentsForViewer(students, user.role);
}

export async function sanitizeOneStudentForUser(student: Student, user: User): Promise<Student> {
  return studentUseCases.sanitizeStudentForViewer(student, user.role);
}
