import type { InferSelectModel } from 'drizzle-orm';
import type { students } from '../../db/schema/students.js';
import type { studentRecordSchema } from '@mms/shared';
import type { z } from 'zod';

export type StudentDbRow = InferSelectModel<typeof students>;
export type StudentDto = z.infer<typeof studentRecordSchema>;

/**
 * Single source of truth mapper converting Drizzle persistence models
 * into client-facing API response DTOs with guaranteed type safety.
 */
export function mapStudentDbToDto(row: StudentDbRow): StudentDto {
  return {
    id: row.id,
    workspaceSubdomain: row.workspaceSubdomain,
    contactId: row.contactId ?? undefined,
    fatherContactId: row.fatherContactId ?? undefined,
    motherContactId: row.motherContactId ?? undefined,
    guardianContactId: row.guardianContactId ?? undefined,
    fatherName: row.fatherName ?? undefined,
    motherName: row.motherName ?? undefined,
    guardianName: row.guardianName ?? undefined,
    grNumber: row.grNumber ?? undefined,
    studentId: row.studentId ?? undefined,
    status: (row.status ?? 'active') as StudentDto['status'],
    registeredDate: row.registeredDate ?? undefined,
    enrollmentDate: row.enrollmentDate ?? undefined,
    discountType: row.discountType ?? undefined,
    discountPct: row.discountPct ? Number(row.discountPct) : undefined,
    registrationType: row.registrationType ?? undefined,
    notes: row.notes ?? undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
