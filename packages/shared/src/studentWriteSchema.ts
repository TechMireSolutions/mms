import { z } from 'zod';
import { stripStudentClientSoftDeleteFields } from './studentUtils.js';
import {
  STUDENT_WRITE_SYSTEM_KEYS,
} from './studentValidation.js';

const STUDENT_WRITE_SYSTEM_KEY_SET = new Set<string>(STUDENT_WRITE_SYSTEM_KEYS);

const studentWriteBaseObjectSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    contactId: z.union([z.string(), z.number()]).nullish().transform((v) => (v === null ? undefined : v)),
    fatherContactId: z.union([z.string(), z.number()]).nullish().transform((v) => (v === null ? undefined : v)),
    motherContactId: z.union([z.string(), z.number()]).nullish().transform((v) => (v === null ? undefined : v)),
    guardianContactId: z.union([z.string(), z.number()]).nullish().transform((v) => (v === null ? undefined : v)),
    studentId: z.string().optional(),
    grNumber: z.string().optional(),
    status: z.string().optional(),
    enrollmentDate: z.string().optional(),
    registeredDate: z.string().optional(),
    cnic: z.string().optional(),
    enrolledSessions: z.array(z.string()).optional(),
    discountType: z.string().optional(),
    discountPct: z.number().optional(),
    registrationType: z.string().optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
    notes: z.string().optional(),
    name: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    city: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    guardianName: z.string().optional(),
    _blueprintId: z.union([z.string(), z.number()]).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .strict();

/**
 * Student write DTO: soft-delete strip, then strict allowlist (system keys ∪
 * Setup custom field keys). Unknown top-level keys are rejected.
 */
export function buildStudentWriteSchema(extraFieldKeys: string[] = []): z.ZodTypeAny {
  const extras = [...new Set(extraFieldKeys.map((key) => key.trim()).filter(Boolean))].filter(
    (key) => !STUDENT_WRITE_SYSTEM_KEY_SET.has(key),
  );
  const extraShape = Object.fromEntries(extras.map((key) => [key, z.unknown().optional()]));
  const shapeSchema =
    extras.length > 0
      ? studentWriteBaseObjectSchema.extend(extraShape).strict()
      : studentWriteBaseObjectSchema;

  return z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return stripStudentClientSoftDeleteFields(raw as Record<string, unknown>);
  }, shapeSchema);
}

/** System-keys-only write schema (no Setup custom keys). Prefer `buildStudentWriteSchema` on tenant writes. */
export const studentWriteSchema = buildStudentWriteSchema();
