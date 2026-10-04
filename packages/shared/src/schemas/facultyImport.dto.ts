import { z } from 'zod';
import { deepSanitizeStrings } from './sanitize.js';

export const FACULTY_IMPORT_MAX_BATCH = 500;

const importIdempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .optional();

const facultyImportRowSchema = z
  .object({
    employeeId: z.string().trim().max(100).optional(),
    contactId: z.string().trim().max(100).optional(),
    specialization: z.string().trim().max(200).optional(),
    department: z.string().trim().max(255).optional(),
    designation: z.string().trim().max(150).optional(),
    status: z.string().trim().max(50).optional(),
    qualification: z.string().trim().max(200).optional(),
    joinDate: z.string().trim().max(32).optional(),
  })
  .strict();

export const facultyImportBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, z
  .object({
    rows: z.array(facultyImportRowSchema).min(1).max(FACULTY_IMPORT_MAX_BATCH),
    label: z.string().min(1).max(200).optional(),
    idempotencyKey: importIdempotencyKeySchema,
  })
  .strict());

export type FacultyImportBody = z.infer<typeof facultyImportBodySchema>;

export interface FacultyImportJobPayload {
  rows: FacultyImportBody['rows'];
  label?: string;
  viewerRole: string;
  language?: string;
}

const departmentImportRowSchema = z
  .object({
    code: z.string().trim().min(1).max(32),
    name: z.string().trim().min(1).max(255),
    parentCode: z.string().trim().max(32).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const facultyDepartmentImportBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, z
  .object({
    rows: z.array(departmentImportRowSchema).min(1).max(FACULTY_IMPORT_MAX_BATCH),
    label: z.string().min(1).max(200).optional(),
    idempotencyKey: importIdempotencyKeySchema,
  })
  .strict());

export type FacultyDepartmentImportBody = z.infer<typeof facultyDepartmentImportBodySchema>;

const designationImportRowSchema = z
  .object({
    code: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(150),
    hierarchyRank: z.number().int().min(1).max(99).optional(),
    isActive: z.boolean().optional(),
    assignableRoles: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  })
  .strict();

export const facultyDesignationImportBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, z
  .object({
    rows: z.array(designationImportRowSchema).min(1).max(FACULTY_IMPORT_MAX_BATCH),
    label: z.string().min(1).max(200).optional(),
    idempotencyKey: importIdempotencyKeySchema,
  })
  .strict());

export type FacultyDesignationImportBody = z.infer<typeof facultyDesignationImportBodySchema>;
