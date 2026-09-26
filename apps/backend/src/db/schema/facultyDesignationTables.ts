import { pgTable, text, timestamp, uniqueIndex, index, integer, primaryKey, foreignKey, varchar, boolean, date, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './platform.js';
import { faculty } from './faculty.js';

/**
 * Faculty designations (master catalog per tenant).
 */
export const facultyDesignations = pgTable('faculty_designations', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  hierarchyRank: integer('hierarchy_rank').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('faculty_designations_workspace_code_uidx').on(table.workspaceSubdomain, table.code),
  index('faculty_designations_workspace_active_rank_idx').on(table.workspaceSubdomain, table.isActive, table.hierarchyRank),
  check('faculty_designations_hierarchy_rank_positive_check', sql`${table.hierarchyRank} > 0`),
]);

/** Workspace roles that may be assigned while a designation is current. */
export const facultyDesignationRoles = pgTable('faculty_designation_roles', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  designationId: text('designation_id').notNull(),
  roleKey: varchar('role_key', { length: 100 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.designationId, table.roleKey] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.designationId],
    foreignColumns: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }).onDelete('cascade'),
  index('faculty_designation_roles_workspace_role_idx').on(table.workspaceSubdomain, table.roleKey),
]);

/** Non-overlapping dated designation history for each Faculty member. */
export const facultyDesignationAssignments = pgTable('faculty_designation_assignments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  facultyId: text('faculty_id').notNull(),
  designationId: text('designation_id').notNull(),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.facultyId],
    foreignColumns: [faculty.workspaceSubdomain, faculty.id],
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.designationId],
    foreignColumns: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }).onDelete('restrict'),
  check('faculty_designation_assignment_period_check', sql`${table.endsOn} is null or ${table.endsOn} >= ${table.startsOn}`),
  index('faculty_designation_assignments_workspace_faculty_start_idx').on(table.workspaceSubdomain, table.facultyId, table.startsOn),
  index('faculty_designation_assignments_workspace_designation_idx').on(table.workspaceSubdomain, table.designationId),
  uniqueIndex('faculty_designation_assignments_one_open_uidx')
    .on(table.workspaceSubdomain, table.facultyId)
    .where(sql`${table.endsOn} is null`),
]);

export type FacultyDesignationRow = typeof facultyDesignations.$inferSelect;
export type InsertFacultyDesignationRow = typeof facultyDesignations.$inferInsert;
export type FacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferSelect;
export type InsertFacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferInsert;
export type FacultyDesignationAssignmentRow = typeof facultyDesignationAssignments.$inferSelect;
export type InsertFacultyDesignationAssignmentRow = typeof facultyDesignationAssignments.$inferInsert;
