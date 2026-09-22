import { z } from 'zod';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/** A tenant-defined designation and the roles it permits an assignee to hold. */
export const facultyDesignationSchema = z.object({
  id: z.string().min(1).max(100),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(150),
  hierarchyRank: z.coerce.number().int().min(1).max(99),
  isActive: z.boolean().default(true),
  assignableRoles: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

/** Write payload for a designation definition. */
export const facultyDesignationWriteSchema = facultyDesignationSchema
  .omit({ createdAt: true, updatedAt: true });

const facultyDesignationAssignmentBaseSchema = z.object({
  id: z.string().min(1).max(100),
  facultyId: z.string().min(1).max(100),
  designationId: z.string().min(1).max(100),
  designationName: z.string().max(150).optional(),
  hierarchyRank: z.coerce.number().int().min(1).max(99).optional(),
  assignableRoles: z.array(z.string().max(100)).optional(),
  startsOn: z.string().regex(isoDate),
  endsOn: z.string().regex(isoDate).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

const validPeriod = (assignment: { startsOn: string; endsOn?: string | null }) =>
  !assignment.endsOn || assignment.endsOn >= assignment.startsOn;

/** A dated designation held by one Faculty member. Periods are inclusive. */
export const facultyDesignationAssignmentSchema = facultyDesignationAssignmentBaseSchema.refine(
  validPeriod,
  { path: ['endsOn'], message: 'Designation end date must not precede its start date' },
);

/** Write payload for assigning a designation period to a Faculty member. */
export const facultyDesignationAssignmentWriteSchema = facultyDesignationAssignmentBaseSchema
  .omit({ designationName: true, hierarchyRank: true, assignableRoles: true, createdAt: true, updatedAt: true })
  .refine(validPeriod, { path: ['endsOn'], message: 'Designation end date must not precede its start date' });

export type FacultyDesignationDefinition = z.infer<typeof facultyDesignationSchema>;
export type FacultyDesignationWrite = z.infer<typeof facultyDesignationWriteSchema>;
export type FacultyDesignationAssignment = z.infer<typeof facultyDesignationAssignmentSchema>;
export type FacultyDesignationAssignmentWrite = z.infer<typeof facultyDesignationAssignmentWriteSchema>;
