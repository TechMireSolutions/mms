import { pgTable, text, timestamp, uniqueIndex, index, integer, jsonb, primaryKey, foreignKey, varchar, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";
import { contacts } from "./contacts.js";

/**
 * Students entity rows — normalized 3NF relational columns.
 */
export const students = pgTable('students', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id'),
  fatherContactId: text('father_contact_id'),
  motherContactId: text('mother_contact_id'),
  guardianContactId: text('guardian_contact_id'),
  fatherName: varchar('father_name', { length: 255 }),
  motherName: varchar('mother_name', { length: 255 }),
  guardianName: varchar('guardian_name', { length: 255 }),
  grNumber: varchar('gr_number', { length: 100 }),
  studentId: varchar('student_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  registeredDate: varchar('registered_date', { length: 35 }),
  enrollmentDate: varchar('enrollment_date', { length: 35 }),
  discountType: varchar('discount_type', { length: 100 }),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }),
  registrationType: varchar('registration_type', { length: 100 }),
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
  index('students_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('students_workspace_gr_number_idx').on(table.workspaceSubdomain, table.grNumber),
  index('students_workspace_student_id_idx').on(table.workspaceSubdomain, table.studentId),
  index('students_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('students_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('students_workspace_contact_active_idx')
    .on(table.workspaceSubdomain, table.contactId)
    .where(sql`${table.deletedAt} is null and ${table.contactId} is not null`),
  index('students_workspace_father_contact_idx').on(table.workspaceSubdomain, table.fatherContactId),
  index('students_workspace_mother_contact_idx').on(table.workspaceSubdomain, table.motherContactId),
  index('students_workspace_guardian_contact_idx').on(table.workspaceSubdomain, table.guardianContactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.fatherContactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.motherContactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.guardianContactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
]);

export const studentEnrolledSessions = pgTable('student_enrolled_sessions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.studentId, table.id] }),
  index('student_enrolled_sessions_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('student_enrolled_sessions_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.studentId],
    foreignColumns: [students.workspaceSubdomain, students.id],
  }).onDelete('cascade'),
]);

/**
 * Students Setup option lists (statuses, genderFilters, discountTypes).
 * Replaces document-store collections studentStatuses / studentGenderFilters / studentDiscountTypes.
 */
export const studentLookups = pgTable('student_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('student_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('student_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Students Setup field registry (was document-store `students_settings` fields slice). */
export const studentFieldConfigs = pgTable('student_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Students Setup preferences — GR / auto-id (was document-store `students_settings` prefs slice). */
export const studentModulePreferences = pgTable('student_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Students Work column layout (was document-store `student_user_column_preferences`). */
/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type StudentRow = typeof students.$inferSelect;
export type InsertStudentRow = typeof students.$inferInsert;
export type StudentEnrolledSessionRow = typeof studentEnrolledSessions.$inferSelect;
export type InsertStudentEnrolledSessionRow = typeof studentEnrolledSessions.$inferInsert;
export type StudentLookupsRow = typeof studentLookups.$inferSelect;
export type InsertStudentLookupsRow = typeof studentLookups.$inferInsert;
export type StudentFieldConfigsRow = typeof studentFieldConfigs.$inferSelect;
export type InsertStudentFieldConfigsRow = typeof studentFieldConfigs.$inferInsert;
export type StudentModulePreferencesRow = typeof studentModulePreferences.$inferSelect;
export type InsertStudentModulePreferencesRow = typeof studentModulePreferences.$inferInsert;
