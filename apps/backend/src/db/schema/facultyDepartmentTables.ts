import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
  foreignKey,
  varchar,
  boolean,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './platform.js';
import { softDeleteColumns } from './softDeleteSchema.js';

/**
 * Normalized faculty department catalog per workspace.
 *
 * Supports unbounded hierarchical nesting via `parent_id` (self-reference).
 * Root departments/faculties/schools have `parent_id = NULL`.
 */
export const facultyDepartments = pgTable('faculty_departments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain')
    .notNull()
    .references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 32 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('faculty_departments_workspace_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt),
  index('faculty_departments_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  // Unique dept code per workspace among active rows
  uniqueIndex('faculty_departments_ws_code_active_uidx')
    .on(table.workspaceSubdomain, table.code)
    .where(sql`${table.deletedAt} is null`),
  // Hierarchy traversal — parent lookup
  index('faculty_departments_parent_active_idx')
    .on(table.workspaceSubdomain, table.parentId)
    .where(sql`${table.deletedAt} is null`),
  // Soft-deleted records index for trash view
  index('faculty_departments_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),
  // Prevent self-parenting
  check(
    'faculty_departments_no_self_parent_check',
    sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`,
  ),
  // Self-referencing parent FK
  foreignKey({
    columns: [table.workspaceSubdomain, table.parentId],
    foreignColumns: [table.workspaceSubdomain, table.id],
  }).onDelete('restrict'),
]);

/* ── Inferred Types ── */
export type FacultyDepartmentRow = typeof facultyDepartments.$inferSelect;
export type InsertFacultyDepartmentRow = typeof facultyDepartments.$inferInsert;
