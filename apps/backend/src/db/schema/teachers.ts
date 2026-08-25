import { pgTable, text, timestamp, uniqueIndex, index, integer, jsonb, primaryKey, foreignKey, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";
import { contacts, tenantUsers } from "./contacts.js";

/**
 * Teachers entity rows — normalized 3NF relational columns.
 */
export const teachers = pgTable('teachers', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id'),
  userId: text('user_id'),
  employeeId: varchar('employee_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  specialization: varchar('specialization', { length: 150 }),
  qualification: varchar('qualification', { length: 255 }),
  joinDate: varchar('join_date', { length: 35 }),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('teachers_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('teachers_workspace_employee_id_idx').on(table.workspaceSubdomain, table.employeeId),
  index('teachers_workspace_specialization_idx').on(table.workspaceSubdomain, table.specialization),
  index('teachers_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('teachers_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('teachers_workspace_contact_active_idx')
    .on(table.workspaceSubdomain, table.contactId)
    .where(sql`${table.deletedAt} is null and ${table.contactId} is not null`),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.userId],
    foreignColumns: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }).onDelete('set null'),
]);

/**
 * Teachers Setup option lists (statuses, specializations).
 * Replaces document-store collections teacherStatuses / teacherSpecializations.
 */
export const teacherLookups = pgTable('teacher_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('teacher_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('teacher_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Teachers Setup field registry (was document-store `teachers_settings` fields slice). */
export const teacherFieldConfigs = pgTable('teacher_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Teachers Setup preferences — ID prefix / contact link (was document-store prefs slice). */
export const teacherModulePreferences = pgTable('teacher_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Teachers Work column layout (was document-store `teacher_user_column_preferences`). */
/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type TeacherRow = typeof teachers.$inferSelect;
export type InsertTeacherRow = typeof teachers.$inferInsert;
export type TeacherLookupsRow = typeof teacherLookups.$inferSelect;
export type InsertTeacherLookupsRow = typeof teacherLookups.$inferInsert;
export type TeacherFieldConfigsRow = typeof teacherFieldConfigs.$inferSelect;
export type InsertTeacherFieldConfigsRow = typeof teacherFieldConfigs.$inferInsert;
export type TeacherModulePreferencesRow = typeof teacherModulePreferences.$inferSelect;
export type InsertTeacherModulePreferencesRow = typeof teacherModulePreferences.$inferInsert;
