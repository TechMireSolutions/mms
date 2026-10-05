import { pgTable, text, timestamp, uniqueIndex, index, integer, primaryKey, foreignKey, varchar, boolean, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './platform.js';
import { softDeleteColumns } from './softDeleteSchema.js';

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
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('faculty_designations_workspace_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt),
  index('faculty_designations_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  uniqueIndex('faculty_designations_ws_code_active_uidx').on(table.workspaceSubdomain, table.code)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_designations_active_rank_idx').on(table.workspaceSubdomain, table.hierarchyRank)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_designations_deleted_idx').on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),
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

export type FacultyDesignationRow = typeof facultyDesignations.$inferSelect;
export type InsertFacultyDesignationRow = typeof facultyDesignations.$inferInsert;
export type FacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferSelect;
export type InsertFacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferInsert;
