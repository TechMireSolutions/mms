import { pgTable, text, timestamp, uniqueIndex, index, integer, jsonb, primaryKey, foreignKey, varchar, boolean, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";
import { contacts, tenantUsers } from "./contacts.js";
import { softDeleteColumns } from "./softDeleteSchema.js";

/**
 * Faculty entity rows — normalized 3NF relational columns.
 */
export const faculty = pgTable('faculty', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id'),
  userId: text('user_id'),
  employeeId: varchar('employee_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  specialization: varchar('specialization', { length: 150 }),
  department: varchar('department', { length: 150 }),
  designation: varchar('designation', { length: 150 }),
  reportingFacultyId: text('reporting_faculty_id'),
  hierarchyRank: integer('hierarchy_rank').notNull().default(10),
  qualification: varchar('qualification', { length: 255 }),
  joinDate: varchar('join_date', { length: 35 }),
  notes: text('notes'),
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('faculty_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('faculty_workspace_employee_id_idx').on(table.workspaceSubdomain, table.employeeId),
  index('faculty_workspace_specialization_idx').on(table.workspaceSubdomain, table.specialization),
  index('faculty_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('faculty_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_id_active_idx')
    .on(table.workspaceSubdomain, table.id)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_status_id_active_idx')
    .on(table.workspaceSubdomain, table.status, table.id)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_created_at_active_idx')
    .on(table.workspaceSubdomain, table.createdAt)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_updated_at_active_idx')
    .on(table.workspaceSubdomain, table.updatedAt)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_status_updated_at_active_idx')
    .on(table.workspaceSubdomain, table.status, table.updatedAt)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_status_expr_updated_at_active_idx')
    .on(table.workspaceSubdomain, sql`(lower(btrim(COALESCE(${table.status}, 'active'))))`, table.updatedAt)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_status_expr_id_active_idx')
    .on(table.workspaceSubdomain, sql`(lower(btrim(COALESCE(${table.status}, 'active'))))`, table.id)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_specialization_active_idx')
    .on(table.workspaceSubdomain, table.specialization)
    .where(sql`${table.deletedAt} is null`),
  uniqueIndex('faculty_workspace_employee_id_active_uidx')
    .on(table.workspaceSubdomain, table.employeeId)
    .where(sql`${table.deletedAt} is null and ${table.employeeId} is not null`),
  index('faculty_workspace_deleted_records_idx')
    .on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),
  index('faculty_workspace_contact_active_idx')
    .on(table.workspaceSubdomain, table.contactId)
    .where(sql`${table.deletedAt} is null and ${table.contactId} is not null`),
  index('faculty_workspace_reporting_faculty_idx')
    .on(table.workspaceSubdomain, table.reportingFacultyId)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_hierarchy_rank_idx')
    .on(table.workspaceSubdomain, table.hierarchyRank)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_status_rank_idx')
    .on(table.workspaceSubdomain, table.status, table.hierarchyRank)
    .where(sql`${table.deletedAt} is null`),
  index('faculty_workspace_user_idx').on(table.workspaceSubdomain, table.userId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.userId],
    foreignColumns: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }).onDelete('set null'),
  foreignKey({
    columns: [table.workspaceSubdomain, table.reportingFacultyId],
    foreignColumns: [table.workspaceSubdomain, table.id],
  }).onDelete('set null'),
]);

/** Tenant-defined Faculty designations and their authority rank. */
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

/**
 * Faculty Setup option lists (statuses, specializations, departments, designations).
 */
export const facultyLookups = pgTable('faculty_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('faculty_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('faculty_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Faculty Setup field registry. */
export const facultyFieldConfigs = pgTable('faculty_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Faculty Setup preferences — ID prefix / contact link. */
export const facultyModulePreferences = pgTable('faculty_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/**
 * Faculty Setup Config — deterministic dynamic Employee ID generation engine state.
 */
export const facultySetupConfig = pgTable('faculty_setup_config', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  prefix: varchar('prefix', { length: 20 }).notNull().default('FAC'),
  yearFormat: varchar('year_format', { length: 10 }).notNull().default('YYYY'),
  sequenceDigits: integer('sequence_digits').notNull().default(4),
  delimiter: varchar('delimiter', { length: 5 }).notNull().default(''),
  currentSequence: integer('current_sequence').notNull().default(0),
  lastYear: integer('last_year').notNull().default(2026),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

export const teacherSetupConfig = facultySetupConfig;

/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type FacultyRow = typeof faculty.$inferSelect;
export type InsertFacultyRow = typeof faculty.$inferInsert;
export type FacultyDesignationRow = typeof facultyDesignations.$inferSelect;
export type InsertFacultyDesignationRow = typeof facultyDesignations.$inferInsert;
export type FacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferSelect;
export type InsertFacultyDesignationRoleRow = typeof facultyDesignationRoles.$inferInsert;
export type FacultyDesignationAssignmentRow = typeof facultyDesignationAssignments.$inferSelect;
export type InsertFacultyDesignationAssignmentRow = typeof facultyDesignationAssignments.$inferInsert;
export type FacultyLookupsRow = typeof facultyLookups.$inferSelect;
export type InsertFacultyLookupsRow = typeof facultyLookups.$inferInsert;
export type FacultyFieldConfigsRow = typeof facultyFieldConfigs.$inferSelect;
export type InsertFacultyFieldConfigsRow = typeof facultyFieldConfigs.$inferInsert;
export type FacultyModulePreferencesRow = typeof facultyModulePreferences.$inferSelect;
export type InsertFacultyModulePreferencesRow = typeof facultyModulePreferences.$inferInsert;
export type FacultySetupConfigRow = typeof facultySetupConfig.$inferSelect;
export type InsertFacultySetupConfigRow = typeof facultySetupConfig.$inferInsert;
export type TeacherSetupConfigRow = FacultySetupConfigRow;
export type InsertTeacherSetupConfigRow = InsertFacultySetupConfigRow;

/* ========================================================================= */
/*                    BACKWARD COMPATIBILITY ALIASES                        */
/* ========================================================================= */

export const teachers = faculty;
export const teacherLookups = facultyLookups;
export const teacherFieldConfigs = facultyFieldConfigs;
export const teacherModulePreferences = facultyModulePreferences;

export type TeacherRow = FacultyRow;
export type InsertTeacherRow = InsertFacultyRow;
export type TeacherLookupsRow = FacultyLookupsRow;
export type InsertTeacherLookupsRow = InsertFacultyLookupsRow;
export type TeacherFieldConfigsRow = FacultyFieldConfigsRow;
export type InsertTeacherFieldConfigsRow = InsertFacultyFieldConfigsRow;
export type TeacherModulePreferencesRow = FacultyModulePreferencesRow;
export type InsertTeacherModulePreferencesRow = InsertFacultyModulePreferencesRow;
