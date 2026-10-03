import { z } from 'zod';

// ── Faculty Department Entity ─────────────────────────────────────────────────

/**
 * Read-model for a `faculty_departments` row.
 * Returned by GET /api/faculty/departments and list endpoints.
 */
export const facultyDepartmentSchema = z.object({
  id: z.string().min(1).max(100),
  workspaceSubdomain: z.string().min(1).max(63).optional(),
  parentId: z.string().min(1).max(100).nullable().optional(),
  name: z.string().trim().min(1).max(255),
  code: z.string().trim().min(1).max(32),
  headFacultyId: z.string().min(1).max(100).nullable().optional(),
  /** Depth relative to root (0 = root; hydrated server-side). */
  depth: z.number().int().min(0).optional(),
  /** Child department count; hydrated server-side on list endpoints. */
  childCount: z.number().int().min(0).optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** Write payload when creating or updating a department. */
export const facultyDepartmentWriteSchema = facultyDepartmentSchema
  .pick({ id: true, parentId: true, name: true, code: true, headFacultyId: true })
  .extend({
    id: z.string().min(1).max(100).optional(), // optional on create
  })
  .partial({ id: true, parentId: true, headFacultyId: true }).strict();

export type FacultyDepartmentEntity = z.infer<typeof facultyDepartmentSchema>;
export type FacultyDepartmentWrite = z.infer<typeof facultyDepartmentWriteSchema>;

// ── Faculty Assignment Entity ─────────────────────────────────────────────────

const isoDate = z.iso.date();

/**
 * Read-model for a `faculty_assignments` row.
 * Returned by GET /api/faculty/:id/assignments.
 */
export const facultyAssignmentSchema = z.object({
  id: z.string().min(1).max(100),
  facultyId: z.string().min(1).max(100),
  departmentId: z.string().min(1).max(100),
  designationId: z.string().min(1).max(100),
  positionId: z.string().min(1).max(100).nullable().optional(),
  reportsToAssignmentId: z.string().min(1).max(100).nullable().optional(),
  isPrimary: z.boolean().default(false),
  startDate: isoDate,
  endDate: isoDate.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  /** Hydrated from linked department row — for display only. */
  departmentName: z.string().optional(),
  /** Hydrated from linked designation row — for display only. */
  designationName: z.string().optional(),
  designationHierarchyRank: z.number().int().min(1).max(99).optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

/** Write payload for creating or updating an assignment. */
export const facultyAssignmentWriteSchema = facultyAssignmentSchema
  .omit({
    departmentName: true,
    designationName: true,
    designationHierarchyRank: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().min(1).max(100).optional(),
  })
  .refine(
    (a) => !a.endDate || a.endDate >= a.startDate,
    { path: ['endDate'], message: 'End date must not precede start date' },
  );

export type FacultyAssignmentEntity = z.infer<typeof facultyAssignmentSchema>;
export type FacultyAssignmentWrite = z.infer<typeof facultyAssignmentWriteSchema>;

export const facultyAssignmentTreeNodeSchema = facultyAssignmentSchema.pick({
  id: true, facultyId: true, departmentId: true, designationId: true,
  reportsToAssignmentId: true, isPrimary: true, startDate: true, endDate: true,
}).extend({
  reportsToAssignmentId: z.string().nullable(),
  endDate: z.iso.date().nullable(),
  depth: z.number().int().min(1).max(20),
  path: z.array(z.string()).min(2).max(21),
  isCycle: z.boolean(),
}).strict();

export type FacultyAssignmentTreeNode = z.infer<typeof facultyAssignmentTreeNodeSchema>;
