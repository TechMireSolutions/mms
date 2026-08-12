import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, serial, primaryKey, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { PersistedSavedReportCategory, PlatformAdminPermissions, PlatformRole } from '@mms/shared';
import { DEFAULT_PLATFORM_ADMIN_PERMISSIONS } from '@mms/shared';

export const collections = pgTable('collections', {
  name: text('name').primaryKey(),
  data: jsonb('data').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const objects = pgTable('objects', {
  key: text('key').primaryKey(),
  data: jsonb('data').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Ephemeral auth state: handoffs, 2FA challenges, refresh tokens. */
export const authArtifacts = pgTable('auth_artifacts', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  /** Indexed opaque key (e.g. refresh token hash) for O(1) lookup. */
  lookupKey: text('lookup_key'),
  /** Indexed scope (e.g. user:{id} or ws:{subdomain}) for bulk revoke. */
  scopeKey: text('scope_key'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('auth_artifacts_kind_expires_idx').on(table.kind, table.expiresAt),
  uniqueIndex('auth_artifacts_lookup_key_uidx')
    .on(table.lookupKey)
    .where(sql`${table.lookupKey} is not null`),
  index('auth_artifacts_scope_key_idx')
    .on(table.scopeKey)
    .where(sql`${table.scopeKey} is not null`),
]);

/** Apex workspaces registry — not tenant-scoped. */
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  madrasaName: text('madrasa_name').notNull(),
  tagline: text('tagline'),
  country: text('country'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('workspaces_subdomain_idx').on(table.subdomain),
]);

/** Apex platform super-users — not tenant-scoped. */
export const platformUsers = pgTable('platform_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
  role: text('role').$type<PlatformRole>().notNull().default('admin'),
  permissions: jsonb('permissions')
    .$type<PlatformAdminPermissions>()
    .notNull()
    .default(DEFAULT_PLATFORM_ADMIN_PERMISSIONS),
  sessionVersion: integer('session_version').notNull().default(0),
  disabledAt: timestamp('disabled_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('platform_users_email_idx').on(table.email),
  uniqueIndex('platform_users_single_super_user_idx')
    .on(table.role)
    .where(sql`${table.role} = 'super_user'`),
  // CHECK enforced in SQL migrations (platform_users_role_check).
]);

/** Apex platform settings — single row (id = 'global') for TLS & Certbot settings. */
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('global'),
  syncTlsOnCreate: boolean('sync_tls_on_create').notNull().default(true),
  tlsExtraSans: text('tls_extra_sans').notNull().default(''),
  certbotEmail: text('certbot_email').notNull().default(''),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Madrasa workspace auth users — isolated per subdomain. */
export const tenantUsers = pgTable('tenant_users', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  loginEmail: text('login_email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('assistant_teacher'),
  contactId: text('contact_id'),
  emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
  pendingLoginEmail: text('pending_login_email'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  /** Non-auth profile fields from legacy JSON user rows. */
  profileJson: jsonb('profile_json').$type<Record<string, unknown>>(),
}, (table) => [
  uniqueIndex('tenant_users_workspace_login_email_active_idx')
    .on(table.workspaceSubdomain, table.loginEmail)
    .where(sql`${table.deletedAt} is null`),
  index('tenant_users_workspace_idx').on(table.workspaceSubdomain),
  index('tenant_users_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
]);

export const dataMigrations = pgTable('data_migrations', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { mode: 'date' }).notNull().defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('contacts_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('contacts_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('contacts_custom_data_gin_idx').using('gin', table.customData),
]);

/** Per-user Google Contacts OAuth credentials — never stored in objects KV. */
export const contactGoogleSyncCredentials = pgTable('contact_google_sync_credentials', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  clientId: text('client_id'),
  clientSecret: text('client_secret'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
]);

/**
 * Contacts Setup option lists (genders, labels, country dial codes, …).
 * Replaces unscoped document-store `collections` KV for these kinds.
 */
export const contactLookups = pgTable('contact_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('contact_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('contact_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Contacts Setup field registry (was document-store `contact_field_config`). */
export const contactFieldConfigs = pgTable('contact_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Contacts Setup preferences (was document-store `contact_preferences`). */
export const contactModulePreferences = pgTable('contact_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Contacts Work column layout (was document-store `contact_user_column_preferences`). */
export const contactUserColumnPrefs = pgTable('contact_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('contact_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Students Setup field registry (was document-store `students_settings` fields slice). */
export const studentFieldConfigs = pgTable('student_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Students Setup preferences — GR / auto-id (was document-store `students_settings` prefs slice). */
export const studentModulePreferences = pgTable('student_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Students Work column layout (was document-store `student_user_column_preferences`). */
export const studentUserColumnPrefs = pgTable('student_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('student_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/**
 * Students entity rows.
 * Typed `status` / `gr_number` (0017) dual-write with JSONB API SSOT.
 * Expression indexes (gender 0016; status/GR on typed cols 0017) are SQL SSOT.
 * Composite FK `contact_id` → contacts (0019) ON DELETE SET NULL.
 */
export const students = pgTable('students', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  contactId: text('contact_id'),
  status: text('status'),
  grNumber: text('gr_number'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('students_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('students_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('students_workspace_contact_active_idx')
    .on(table.workspaceSubdomain, table.contactId)
    .where(sql`${table.deletedAt} is null and ${table.contactId} is not null`),
  index('students_custom_data_gin_idx').using('gin', table.customData),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
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
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('student_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('student_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Teachers Setup field registry (was document-store `teachers_settings` fields slice). */
export const teacherFieldConfigs = pgTable('teacher_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Teachers Setup preferences — ID prefix / contact link (was document-store prefs slice). */
export const teacherModulePreferences = pgTable('teacher_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Teachers Work column layout (was document-store `teacher_user_column_preferences`). */
export const teacherUserColumnPrefs = pgTable('teacher_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('teacher_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/**
 * Teachers entity rows.
 * Composite FK `contact_id` → contacts (0024) ON DELETE SET NULL.
 * Soft-delete audit columns (`deleted_by` / `deletion_reason`) — Drizzle `0026`.
 */
export const teachers = pgTable('teachers', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  contactId: text('contact_id'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('teachers_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('teachers_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('teachers_workspace_contact_active_idx')
    .on(table.workspaceSubdomain, table.contactId)
    .where(sql`${table.deletedAt} is null and ${table.contactId} is not null`),
  index('teachers_custom_data_gin_idx').using('gin', table.customData),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
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
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('teacher_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('teacher_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Sessions Setup field registry (was document-store `sessions_settings` fields slice). */
export const sessionFieldConfigs = pgTable('session_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Sessions Setup preferences (was document-store `sessions_settings` prefs slice). */
export const sessionModulePreferences = pgTable('session_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Sessions Work column layout (was document-store `session_user_column_preferences`). */
export const sessionUserColumnPrefs = pgTable('session_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('session_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Users Setup field registry (was document-store `users_settings` fields slice). */
export const userFieldConfigs = pgTable('user_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Users Setup preferences — registration + workspaceRoles (was document-store prefs slice). */
export const userModulePreferences = pgTable('user_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Users Work column layout (was document-store `users_user_column_preferences`). */
export const userUserColumnPrefs = pgTable('user_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('user_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/**
 * Sessions entity rows.
 * Soft-delete audit columns (`deleted_by` / `deletion_reason`) — Drizzle `0027`.
 */
export const sessions = pgTable('sessions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('sessions_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('sessions_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('sessions_custom_data_gin_idx').using('gin', table.customData),
]);

export const attendance = pgTable('attendance', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('attendance_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('attendance_custom_data_gin_idx').using('gin', table.customData),
]);

export const enrollments = pgTable('enrollments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('enrollments_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('enrollments_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('enrollments_custom_data_gin_idx').using('gin', table.customData),
]);

/** Enrollments Setup field registry (was document-store `enrollments_settings` fields slice). */
export const enrollmentFieldConfigs = pgTable('enrollment_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Enrollments Setup preferences (was document-store `enrollments_settings` prefs slice). */
export const enrollmentModulePreferences = pgTable('enrollment_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Enrollments Work column layout (was document-store `enrollment_user_column_preferences`). */
export const enrollmentUserColumnPrefs = pgTable('enrollment_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('enrollment_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const obligationTypes = pgTable('obligation_types', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_types_custom_data_gin_idx').using('gin', table.customData),
]);

export const mujtahids = pgTable('mujtahids', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('mujtahids_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahids_custom_data_gin_idx').using('gin', table.customData),
]);

export const mujtahidReps = pgTable('mujtahid_reps', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('mujtahid_reps_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahid_reps_custom_data_gin_idx').using('gin', table.customData),
]);

export const wakalaTypes = pgTable('wakala_types', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('wakala_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('wakala_types_custom_data_gin_idx').using('gin', table.customData),
]);

export const obligationDistributions = pgTable('obligation_distributions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_distributions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_distributions_custom_data_gin_idx').using('gin', table.customData),
]);

export const obligationCollections = pgTable('obligation_collections', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_collections_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_collections_custom_data_gin_idx').using('gin', table.customData),
]);

export const financeInvoices = pgTable('finance_invoices', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('finance_invoices_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_invoices_custom_data_gin_idx').using('gin', table.customData),
]);

export const financePayments = pgTable('finance_payments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('finance_payments_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_payments_custom_data_gin_idx').using('gin', table.customData),
]);

export const exams = pgTable('exams', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('exams_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('exams_custom_data_gin_idx').using('gin', table.customData),
]);

export const examResults = pgTable('exam_results', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('exam_results_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('exam_results_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatDenoms = pgTable('hasanat_denoms', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_denoms_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_denoms_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatBatches = pgTable('hasanat_batches', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_batches_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_batches_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatDistributions = pgTable('hasanat_distributions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_distributions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_distributions_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatRedemptions = pgTable('hasanat_redemptions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_redemptions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_redemptions_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingAccounts = pgTable('accounting_accounts', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_accounts_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_accounts_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingEntries = pgTable('accounting_entries', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_entries_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_entries_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingFiscalYears = pgTable('accounting_fiscal_years', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_fiscal_years_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_fiscal_years_custom_data_gin_idx').using('gin', table.customData),
]);

export const questions = pgTable('questions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('questions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('questions_custom_data_gin_idx').using('gin', table.customData),
]);

export const tests = pgTable('tests', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('tests_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('tests_custom_data_gin_idx').using('gin', table.customData),
]);

export const assessmentResults = pgTable('assessment_results', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('assessment_results_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('assessment_results_custom_data_gin_idx').using('gin', table.customData),
]);

export const userActivityLogs = pgTable('user_activity_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('user_activity_logs_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('user_activity_logs_custom_data_gin_idx').using('gin', table.customData),
]);

export const auditLogEntries = pgTable('audit_log_entries', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('audit_log_entries_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('audit_log_entries_custom_data_gin_idx').using('gin', table.customData),
]);



export const backgroundJobs = pgTable('background_jobs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull().references(() => tenantUsers.id, { onDelete: 'cascade' }),
  moduleId: text('module_id').notNull(),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('pending'),
  label: text('label').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  progressCurrent: integer('progress_current'),
  progressTotal: integer('progress_total'),
  artifactId: text('artifact_id'),
  hasDownload: boolean('has_download').notNull().default(false),
  error: text('error'),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('background_jobs_tenant_user_idx').on(table.tenantId, table.userId),
  index('background_jobs_status_idx').on(table.status),
]);

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain'),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: text('user_id'),
  changedAt: timestamp('changed_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_workspace_changed_idx').on(table.workspaceSubdomain, table.changedAt),
  index('audit_logs_table_record_idx').on(table.tableName, table.recordId),
]);

export const customTabs = pgTable('custom_tabs', {
  id: text('id').notNull(), // e.g. subdomain:moduleId:key
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  moduleId: text('module_id').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  icon: text('icon'),
  enabled: boolean('enabled').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  permissions: jsonb('permissions').$type<string[]>(),
  description: text('description'),
  color: text('color'),
  isSystem: boolean('is_system').notNull().default(false),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('custom_tabs_workspace_module_key_idx').on(table.workspaceSubdomain, table.moduleId, table.key),
  index('custom_tabs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Report presets — generic modules + Contacts (`category = 'contacts'`). */
export const savedReports = pgTable('saved_reports', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  category: text('category').$type<PersistedSavedReportCategory>().notNull(),
  name: text('name').notNull(),
  filters: jsonb('filters').$type<Record<string, unknown>>().notNull(),
  lastRunAt: timestamp('last_run_at', { mode: 'date' }).notNull(),
  createdBy: text('created_by').notNull(),
  createdByName: text('created_by_name').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('saved_reports_workspace_category_creator_idx').on(
    table.workspaceSubdomain,
    table.category,
    table.createdBy,
  ),
]);

export const platformActivityLogs = pgTable('platform_activity_logs', {
  id: serial('id').primaryKey(),
  /** Nullable so deleting a platform user retains audit history (ON DELETE SET NULL). */
  userId: text('user_id').references(() => platformUsers.id, { onDelete: 'set null' }),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('platform_activity_logs_created_at_idx').on(table.createdAt),
]);

export const messageTemplates = pgTable('message_templates', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('message_templates_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('message_templates_custom_data_gin_idx').using('gin', table.customData),
]);

export const messageLogs = pgTable('message_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('message_logs_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('message_logs_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('message_logs_custom_data_gin_idx').using('gin', table.customData),
  index('message_logs_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('message_logs_workspace_sent_at_active_idx')
    .on(table.workspaceSubdomain, sql`(custom_data->>'sentAt')`)
    .where(sql`${table.deletedAt} is null`),
]);

export const customFields = pgTable('custom_fields', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  tabId: text('tab_id').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  required: boolean('required').notNull().default(false),
  unique: boolean('unique').notNull().default(false),
  placeholder: text('placeholder'),
  description: text('description'),
  defaultValue: text('default_value'),
  options: jsonb('options').$type<string[]>(),
  minValue: integer('min_value'),
  maxValue: integer('max_value'),
  mask: text('mask'),
  allowedExtensions: text('allowed_extensions'),
  maxFileSize: integer('max_file_size'),
  sortOrder: integer('sort_order').notNull().default(0),
  hasData: boolean('has_data').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('custom_fields_tab_idx').on(table.workspaceSubdomain, table.tabId),
  index('custom_fields_workspace_idx').on(table.workspaceSubdomain),
]);





