import {
  pgTable,
  text,
  timestamp,
  index,
  primaryKey,
  foreignKey,
  boolean,
  date,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './platform.js';
import { faculty } from './faculty.js';
import { facultyDepartments } from './facultyDepartmentTables.js';
import { facultyDesignations } from './facultyDesignationTables.js';
import { softDeleteColumns } from './softDeleteSchema.js';

/**
 * Faculty multi-role temporal assignments.
 *
 * Each row represents a faculty member's active tenure in one
 * (department, designation) pair during a date range.
 *
 * - `is_primary` marks the canonical assignment for a faculty member.
 *   Application logic enforces at most one active primary assignment per faculty;
 *   no DB-level partial unique index is used — this allows historical primary
 *   records and explicit lifecycle transitions.
 *
 * - `reports_to_assignment_id` enables org-chart traversal: the supervisor's
 *   assignment row (not the faculty row directly). Recursive CTEs on this column
 *   produce upward/downward hierarchical views.
 */
export const facultyAssignments = pgTable('faculty_assignments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain')
    .notNull()
    .references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  facultyId: text('faculty_id').notNull(),
  departmentId: text('department_id').notNull(),
  designationId: text('designation_id').notNull(),
  /** Self-referencing: the assignment of the direct reporting supervisor. */
  reportsToAssignmentId: text('reports_to_assignment_id'),
  isPrimary: boolean('is_primary').notNull().default(false),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  notes: text('notes'),
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),

  // Hot-path: list all current assignments for a faculty member
  index('faculty_assignments_faculty_active_idx')
    .on(table.workspaceSubdomain, table.facultyId)
    .where(sql`${table.deletedAt} is null`),

  // Department-scoped listing
  index('faculty_assignments_dept_active_idx')
    .on(table.workspaceSubdomain, table.departmentId)
    .where(sql`${table.deletedAt} is null`),

  // Designation-scoped listing
  index('faculty_assignments_designation_active_idx')
    .on(table.workspaceSubdomain, table.designationId)
    .where(sql`${table.deletedAt} is null`),

  // Supervisor chain traversal (downward from parent assignment)
  index('faculty_assignments_reports_to_active_idx')
    .on(table.workspaceSubdomain, table.reportsToAssignmentId)
    .where(sql`${table.deletedAt} is null`),

  // Primary-assignment look-up per faculty
  index('faculty_assignments_faculty_primary_active_idx')
    .on(table.workspaceSubdomain, table.facultyId, table.isPrimary)
    .where(sql`${table.deletedAt} is null`),

  // Open (unbounded) assignment listing for overlap checks
  index('faculty_assignments_faculty_open_active_idx')
    .on(table.workspaceSubdomain, table.facultyId)
    .where(sql`${table.deletedAt} is null and ${table.endDate} is null`),

  // Soft-deleted trash
  index('faculty_assignments_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),

  // Date-range sanity
  check(
    'faculty_assignments_date_range_check',
    sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
  ),
  // No self-reporting
  check(
    'faculty_assignments_no_self_reporting_check',
    sql`${table.reportsToAssignmentId} is null or ${table.reportsToAssignmentId} <> ${table.id}`,
  ),

  // FK → faculty
  foreignKey({
    columns: [table.workspaceSubdomain, table.facultyId],
    foreignColumns: [faculty.workspaceSubdomain, faculty.id],
  }).onDelete('cascade'),

  // FK → faculty_departments
  foreignKey({
    columns: [table.workspaceSubdomain, table.departmentId],
    foreignColumns: [facultyDepartments.workspaceSubdomain, facultyDepartments.id],
  }).onDelete('restrict'),

  // FK → faculty_designations
  foreignKey({
    columns: [table.workspaceSubdomain, table.designationId],
    foreignColumns: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }).onDelete('restrict'),

  // Self-referencing supervisor assignment FK
  foreignKey({
    columns: [table.workspaceSubdomain, table.reportsToAssignmentId],
    foreignColumns: [table.workspaceSubdomain, table.id],
  }).onDelete('restrict'),
]);

/* ── Inferred Types ── */
export type FacultyAssignmentRow = typeof facultyAssignments.$inferSelect;
export type InsertFacultyAssignmentRow = typeof facultyAssignments.$inferInsert;
