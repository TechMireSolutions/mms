import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, serial, primaryKey, foreignKey, varchar, bigint, numeric } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import type { PersistedSavedReportCategory, PlatformRole } from '@mms/shared';

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
  index('workspaces_enabled_idx').on(table.enabled),
]);

/** Apex platform super-users — not tenant-scoped. */
export const platformUsers = pgTable('platform_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
  role: text('role').$type<PlatformRole>().notNull().default('admin'),
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

/** Normalized 3NF granular permission grants for platform admins. */
export const platformUserPermissions = pgTable('platform_user_permissions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  platformUserId: text('platform_user_id').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  permissionKey: varchar('permission_key', { length: 40 }).notNull(),
  isGranted: boolean('is_granted').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('platform_user_perms_user_key_uidx').on(table.platformUserId, table.permissionKey),
  index('platform_user_perms_user_idx').on(table.platformUserId),
]);

/** Apex platform settings — single row (id = 'global') for TLS & Certbot settings. */
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('global'),
  syncTlsOnCreate: boolean('sync_tls_on_create').notNull().default(true),
  tlsExtraSans: text('tls_extra_sans').notNull().default(''),
  certbotEmail: text('certbot_email').notNull().default(''),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 150 }).notNull(),
  lastName: varchar('last_name', { length: 150 }),
  name: varchar('name', { length: 300 }).notNull(),
  gender: varchar('gender', { length: 20 }),
  dob: varchar('dob', { length: 30 }),
  cnic: varchar('cnic', { length: 30 }),
  isSyed: boolean('is_syed').notNull().default(false),
  tag: varchar('tag', { length: 100 }),
  avatar: text('avatar'),
  notes: text('notes'),
  whatsappStatus: varchar('whatsapp_status', { length: 30 }).notNull().default('unknown'),
  lastCheckedAt: varchar('last_checked_at', { length: 35 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  line1: varchar('line1', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  preferredLanguage: varchar('preferred_language', { length: 50 }),
  preferredContactMethod: varchar('preferred_contact_method', { length: 50 }),
  doNotContact: boolean('do_not_contact').notNull().default(false),
  aiSummary: text('ai_summary'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('contacts_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('contacts_workspace_name_idx').on(table.workspaceSubdomain, table.name),
  index('contacts_workspace_first_name_idx').on(table.workspaceSubdomain, table.firstName),
  index('contacts_workspace_last_name_idx').on(table.workspaceSubdomain, table.lastName),
  index('contacts_workspace_phone_idx').on(table.workspaceSubdomain, table.phone),
  index('contacts_workspace_email_idx').on(table.workspaceSubdomain, table.email),
  index('contacts_workspace_cnic_idx').on(table.workspaceSubdomain, table.cnic),
  index('contacts_workspace_gender_idx').on(table.workspaceSubdomain, table.gender),
  index('contacts_workspace_city_idx').on(table.workspaceSubdomain, table.city),
  index('contacts_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('contacts_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  uniqueIndex('contacts_workspace_cnic_active_uidx')
    .on(
      table.workspaceSubdomain,
      sql`(regexp_replace(${table.cnic}, '[^0-9]', '', 'g'))`,
    )
    .where(
      sql`${table.deletedAt} is null and nullif(regexp_replace(${table.cnic}, '[^0-9]', '', 'g'), '') is not null`,
    ),
  uniqueIndex('contacts_workspace_phone_active_uidx')
    .on(
      table.workspaceSubdomain,
      sql`(regexp_replace(${table.phone}, '[^0-9]', '', 'g'))`,
    )
    .where(
      sql`${table.deletedAt} is null and nullif(regexp_replace(${table.phone}, '[^0-9]', '', 'g'), '') is not null`,
    ),
  uniqueIndex('contacts_workspace_email_active_uidx')
    .on(
      table.workspaceSubdomain,
      sql`(lower(trim(${table.email})))`,
    )
    .where(
      sql`${table.deletedAt} is null and nullif(trim(${table.email}), '') is not null`,
    ),
]);

export const contactPhones = pgTable('contact_phones', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  label: varchar('label', { length: 100 }),
  countryCode: varchar('country_code', { length: 10 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  whatsappStatus: varchar('whatsapp_status', { length: 30 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_phones_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_phones_workspace_number_idx').on(table.workspaceSubdomain, table.number),
]);

export const contactEmails = pgTable('contact_emails', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  label: varchar('label', { length: 100 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_emails_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_emails_workspace_address_idx').on(table.workspaceSubdomain, table.address),
]);

export const contactAddresses = pgTable('contact_addresses', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  label: varchar('label', { length: 100 }),
  line1: varchar('line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_addresses_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactSocials = pgTable('contact_socials', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_socials_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactEducations = pgTable('contact_educations', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  degree: varchar('degree', { length: 150 }),
  institution: varchar('institution', { length: 255 }).notNull(),
  fieldOfStudy: varchar('field_of_study', { length: 255 }),
  year: varchar('year', { length: 50 }),
  grade: varchar('grade', { length: 50 }),
  label: varchar('label', { length: 100 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_educations_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactExperiences = pgTable('contact_experiences', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  organization: varchar('organization', { length: 255 }).notNull(),
  employmentType: varchar('employment_type', { length: 100 }),
  location: varchar('location', { length: 255 }),
  startDate: varchar('start_date', { length: 50 }),
  endDate: varchar('end_date', { length: 50 }),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_experiences_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactSkills = pgTable('contact_skills', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  proficiency: varchar('proficiency', { length: 50 }),
  yearsOfExperience: varchar('years_of_experience', { length: 50 }),
  isCertified: boolean('is_certified').notNull().default(false),
  issuer: varchar('issuer', { length: 255 }),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_skills_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactRelationships = pgTable('contact_relationships', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  relatedContactId: varchar('related_contact_id', { length: 64 }),
  name: varchar('name', { length: 255 }),
  relationship: varchar('relationship', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  inferred: boolean('inferred').notNull().default(false),
  inferredFromContactId: varchar('inferred_from_contact_id', { length: 64 }),
  inferenceDepth: integer('inference_depth').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_relationships_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_relationships_workspace_related_idx').on(table.workspaceSubdomain, table.relatedContactId),
]);

export const contactActivities = pgTable('contact_activities', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  date: varchar('date', { length: 30 }).notNull(),
  by: varchar('by', { length: 64 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_activities_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

export const contactAttachments = pgTable('contact_attachments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  size: integer('size').notNull().default(0),
  url: text('url').notNull(),
  date: varchar('date', { length: 35 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_attachments_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
]);

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

/** Dashboard layout/chart preferences — workspace singleton (was document-store `mms_dashboard_preferences`). */
export const dashboardPreferences = pgTable('dashboard_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Dashboard pinned/custom widgets — normalized rows (was document-store `kpi_custom_widgets`). */
export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  widgetType: varchar('widget_type', { length: 64 }),
  category: varchar('category', { length: 64 }).notNull(),
  collection: varchar('collection', { length: 64 }).notNull(),
  role: varchar('role', { length: 32 }),
  isPinnedToDashboard: boolean('is_pinned_to_dashboard').notNull().default(false),
  title: varchar('title', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 64 }),
  color: varchar('color', { length: 32 }).notNull(),
  operation: varchar('operation', { length: 32 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  /** Remaining widget fields (i18n keys, switch/threshold/chart-render settings). */
  config: jsonb('config').$type<Record<string, unknown> | null>(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('dashboard_widgets_workspace_pinned_idx').on(
    table.workspaceSubdomain,
    table.isPinnedToDashboard,
  ),
]);

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
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('students_workspace_subdomain_idx').on(table.workspaceSubdomain),
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
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
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
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('teachers_workspace_subdomain_idx').on(table.workspaceSubdomain),
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
    columns: [table.userId],
    foreignColumns: [tenantUsers.id],
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

export const sessionLookups = pgTable('session_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'statuses' | 'types'
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('session_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('session_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
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
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  startDate: varchar('start_date', { length: 30 }).notNull(),
  endDate: varchar('end_date', { length: 30 }).notNull(),
  baseFee: numeric('base_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 20 }).notNull().default('PKR'),
  description: text('description'),
  budgetTotalRevenue: numeric('budget_total_revenue', { precision: 12, scale: 2 }).notNull().default('0'),
  budgetCollected: numeric('budget_collected', { precision: 12, scale: 2 }).notNull().default('0'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('sessions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('sessions_workspace_name_idx').on(table.workspaceSubdomain, table.name),
  index('sessions_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('sessions_workspace_type_idx').on(table.workspaceSubdomain, table.type),
  index('sessions_workspace_start_date_idx').on(table.workspaceSubdomain, table.startDate),
  index('sessions_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('sessions_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const sessionClasses = pgTable('session_classes', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  ageMin: integer('age_min').notNull().default(1),
  ageMax: integer('age_max').notNull().default(120),
  gender: varchar('gender', { length: 20 }).notNull().default('any'),
  teacherId: varchar('teacher_id', { length: 64 }).notNull(),
  teacherName: varchar('teacher_name', { length: 255 }),
  capacity: integer('capacity').notNull().default(30),
  enrolled: integer('enrolled').notNull().default(0),
  room: varchar('room', { length: 100 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_classes_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
  index('session_classes_workspace_teacher_idx').on(table.workspaceSubdomain, table.teacherId),
]);

export const sessionTimetable = pgTable('session_timetable', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  day: varchar('day', { length: 10 }).notNull(),
  activity: varchar('activity', { length: 255 }).notNull(),
  startTime: varchar('start_time', { length: 20 }).notNull(),
  endTime: varchar('end_time', { length: 20 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_timetable_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionDiscounts = pgTable('session_discounts', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull().default('0'),
  conditions: text('conditions').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_discounts_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionBudgetExpenses = pgTable('session_budget_expenses', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  date: varchar('date', { length: 30 }).notNull(),
  note: text('note'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_budget_expenses_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionBudgetIncomes = pgTable('session_budget_incomes', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  date: varchar('date', { length: 30 }).notNull(),
  note: text('note'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_budget_incomes_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionEvents = pgTable('session_events', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  date: varchar('date', { length: 30 }).notNull(),
  time: varchar('time', { length: 30 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_events_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionTabarruk = pgTable('session_tabarruk', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  item: varchar('item', { length: 255 }).notNull(),
  quantity: varchar('quantity', { length: 100 }).notNull(),
  occasion: varchar('occasion', { length: 255 }).notNull(),
  date: varchar('date', { length: 30 }).notNull(),
  note: text('note'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  index('session_tabarruk_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const attendanceLookups = pgTable('attendance_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'statuses'
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('attendance_lookups_workspace_kind_sort_idx').on(
    table.workspaceSubdomain,
    table.kind,
    table.sortOrder,
  ),
  index('attendance_lookups_workspace_kind_idx').on(table.workspaceSubdomain, table.kind),
]);

/** Attendance Setup field registry (was document-store `attendance_settings` fields slice). */
export const attendanceFieldConfigs = pgTable('attendance_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Attendance Setup preferences (was document-store `attendance_settings` prefs slice). */
export const attendanceModulePreferences = pgTable('attendance_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Per-user Attendance Work column layout (was document-store `attendance_user_column_preferences`). */
export const attendanceUserColumnPrefs = pgTable('attendance_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('attendance_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const attendance = pgTable('attendance', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  classId: varchar('class_id', { length: 64 }).notNull(),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull().default(''),
  rollNo: varchar('roll_no', { length: 64 }).notNull().default(''),
  date: varchar('date', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('present'),
  timeIn: varchar('time_in', { length: 10 }).notNull().default(''),
  timeOut: varchar('time_out', { length: 10 }).notNull().default(''),
  notes: text('notes').notNull().default(''),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('attendance_workspace_class_student_date_uidx')
    .on(table.workspaceSubdomain, table.classId, table.studentId, table.date)
    .where(sql`${table.deletedAt} is null`),
  index('attendance_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('attendance_workspace_date_idx').on(table.workspaceSubdomain, table.date),
  index('attendance_workspace_class_date_idx').on(table.workspaceSubdomain, table.classId, table.date),
  index('attendance_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('attendance_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
]);

export const attendanceLeaves = pgTable('attendance_leaves', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  fromDate: varchar('from_date', { length: 10 }).notNull(),
  toDate: varchar('to_date', { length: 10 }).notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('attendance_leaves_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('attendance_leaves_workspace_date_idx').on(table.workspaceSubdomain, table.fromDate, table.toDate),
]);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [attendance.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const attendanceLeavesRelations = relations(attendanceLeaves, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [attendanceLeaves.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const enrollments = pgTable('enrollments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull().default(''),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  sessionName: varchar('session_name', { length: 255 }).notNull().default('') ,
  classId: varchar('class_id', { length: 64 }).notNull(),
  className: varchar('class_name', { length: 255 }).notNull().default(''),
  enrolledDate: varchar('enrolled_date', { length: 10 }).notNull(),
  baseFee: numeric('base_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 32 }).notNull().default('none'),
  discountLabel: varchar('discount_label', { length: 120 }).notNull().default(''),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  discountAmt: numeric('discount_amt', { precision: 12, scale: 2 }).notNull().default('0'),
  finalFee: numeric('final_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  invoiceId: varchar('invoice_id', { length: 64 }),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('none'),
  notes: text('notes').notNull().default(''),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('enrollments_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
  index('enrollments_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('enrollments_workspace_class_idx').on(table.workspaceSubdomain, table.classId),
  index('enrollments_workspace_date_idx').on(table.workspaceSubdomain, table.enrolledDate),
  index('enrollments_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('enrollments_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('enrollments_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const enrollmentTimelineEvents = pgTable('enrollment_timeline_events', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  enrollmentId: text('enrollment_id').notNull(),
  event: varchar('event', { length: 120 }).notNull(),
  by: varchar('by', { length: 120 }).notNull(),
  ts: varchar('ts', { length: 40 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('enrollment_timeline_enrollment_idx').on(table.workspaceSubdomain, table.enrollmentId),
]);

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [enrollments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  timelineEvents: many(enrollmentTimelineEvents),
}));

export const enrollmentTimelineEventsRelations = relations(enrollmentTimelineEvents, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [enrollmentTimelineEvents.workspaceSubdomain, enrollmentTimelineEvents.enrollmentId],
    references: [enrollments.workspaceSubdomain, enrollments.id],
  }),
}));

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
  name: varchar('name', { length: 255 }).notNull(),
  quantityBased: boolean('quantity_based').notNull().default(false),
  designatedFor: varchar('designated_for', { length: 20 }).notNull().default('Both'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_types_workspace_name_idx').on(table.workspaceSubdomain, table.name),
]);

export const mujtahids = pgTable('mujtahids', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('mujtahids_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahids_workspace_name_idx').on(table.workspaceSubdomain, table.name),
]);

export const mujtahidReps = pgTable('mujtahid_reps', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  mujtahidId: text('mujtahid_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('mujtahid_reps_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahid_reps_workspace_mujtahid_idx').on(table.workspaceSubdomain, table.mujtahidId),
]);

export const wakalaTypes = pgTable('wakala_types', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  mujtahidRepresentativeId: text('mujtahid_representative_id').notNull(),
  obligationTypeId: text('obligation_type_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('wakala_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('wakala_types_workspace_rep_idx').on(table.workspaceSubdomain, table.mujtahidRepresentativeId),
  index('wakala_types_workspace_type_idx').on(table.workspaceSubdomain, table.obligationTypeId),
]);

export const obligationDistributions = pgTable('obligation_distributions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  wakalaTypeId: text('wakala_type_id').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_distributions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_distributions_workspace_wakala_idx').on(table.workspaceSubdomain, table.wakalaTypeId),
]);

export const obligationCollections = pgTable('obligation_collections', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  receiptNo: varchar('receipt_no', { length: 100 }).notNull(),
  receivedDate: varchar('received_date', { length: 30 }).notNull(),
  senderId: varchar('sender_id', { length: 64 }).notNull(),
  referenceId: varchar('reference_id', { length: 120 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  currencyId: varchar('currency_id', { length: 30 }).notNull(),
  paymentMode: varchar('payment_mode', { length: 30 }).notNull(),
  obligationTypeId: text('obligation_type_id').notNull(),
  mujtahidRepresentativeId: text('mujtahid_representative_id').notNull(),
  receivedBy: varchar('received_by', { length: 255 }).notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('obligation_collections_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_collections_workspace_receipt_idx').on(table.workspaceSubdomain, table.receiptNo),
  index('obligation_collections_workspace_sender_idx').on(table.workspaceSubdomain, table.senderId),
  index('obligation_collections_workspace_type_idx').on(table.workspaceSubdomain, table.obligationTypeId),
  index('obligation_collections_workspace_rep_idx').on(table.workspaceSubdomain, table.mujtahidRepresentativeId),
  index('obligation_collections_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('obligation_collections_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const financeInvoices = pgTable('finance_invoices', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull().default(''),
  class: varchar('class', { length: 120 }).notNull().default(''),
  session: varchar('session', { length: 120 }).notNull().default(''),
  baseFee: numeric('base_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 50 }),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmt: numeric('discount_amt', { precision: 12, scale: 2 }).notNull().default('0'),
  finalAmt: numeric('final_amt', { precision: 12, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  dueDate: varchar('due_date', { length: 10 }).notNull(),
  paidDate: varchar('paid_date', { length: 10 }),
  method: varchar('method', { length: 50 }),
  paidAmt: numeric('paid_amt', { precision: 12, scale: 2 }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('finance_invoices_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_invoices_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('finance_invoices_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('finance_invoices_workspace_due_date_idx').on(table.workspaceSubdomain, table.dueDate),
  index('finance_invoices_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('finance_invoices_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const financePayments = pgTable('finance_payments', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').notNull(),
  studentId: varchar('student_id', { length: 64 }),
  studentName: varchar('student_name', { length: 255 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  date: varchar('date', { length: 10 }).notNull(),
  method: varchar('method', { length: 50 }).notNull().default('cash'),
  receivedByUserId: text('received_by_user_id'),
  receivedBy: varchar('received_by', { length: 120 }),
  note: text('note').notNull().default(''),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('finance_payments_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_payments_workspace_invoice_idx').on(table.workspaceSubdomain, table.invoiceId),
  index('finance_payments_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('finance_payments_workspace_date_idx').on(table.workspaceSubdomain, table.date),
  index('finance_payments_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('finance_payments_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const financeInvoicesRelations = relations(financeInvoices, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [financeInvoices.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  payments: many(financePayments),
}));

export const financePaymentsRelations = relations(financePayments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [financePayments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  invoice: one(financeInvoices, {
    fields: [financePayments.workspaceSubdomain, financePayments.invoiceId],
    references: [financeInvoices.workspaceSubdomain, financeInvoices.id],
  }),
}));

export const financeFieldConfigs = pgTable('finance_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const financeModulePreferences = pgTable('finance_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const accountingFieldConfigs = pgTable('accounting_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const accountingModulePreferences = pgTable('accounting_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Per-user Accounting accounts Work column layout (was document-store `accounting_account_user_column_preferences`). */
export const accountingAccountUserColumnPrefs = pgTable('accounting_account_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('accounting_account_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Accounting journal Work column layout (was document-store `accounting_journal_user_column_preferences`). */
export const accountingJournalUserColumnPrefs = pgTable('accounting_journal_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('accounting_journal_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const financeUserColumnPrefs = pgTable('finance_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('finance_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Finance payments Work column layout (was document-store `finance_payment_user_column_preferences`). */
export const financePaymentUserColumnPrefs = pgTable('finance_payment_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('finance_payment_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const hasanatFieldConfigs = pgTable('hasanat_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const hasanatModulePreferences = pgTable('hasanat_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const examinationsFieldConfigs = pgTable('examinations_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const examinationsModulePreferences = pgTable('examinations_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Per-user Examinations exams Work column layout (was document-store `examination_exam_user_column_preferences`). */
export const examinationExamUserColumnPrefs = pgTable('examination_exam_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('examination_exam_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Examinations results Work column layout (was document-store `examination_results_user_column_preferences`). */
export const examinationResultsUserColumnPrefs = pgTable('examination_results_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('examination_results_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const hasanatDistributionUserColumnPrefs = pgTable('hasanat_distribution_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => tenantUsers.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('hasanat_dist_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const hasanatRedemptionUserColumnPrefs = pgTable('hasanat_redemption_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => tenantUsers.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('hasanat_redemp_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Obligations Work column layout (was document-store `obligations_user_column_preferences`). */
export const obligationsUserColumnPrefs = pgTable('obligations_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('obligations_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Messaging recipients Work column layout (was document-store `messaging_recipients_user_column_preferences`). */
export const messagingRecipientsUserColumnPrefs = pgTable('messaging_recipients_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('messaging_recipients_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Messaging history Work column layout (was document-store `messaging_history_user_column_preferences`). */
export const messagingHistoryUserColumnPrefs = pgTable('messaging_history_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('messaging_history_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

/** Per-user Messaging templates Work column layout (was document-store `messaging_templates_user_column_preferences`). */
export const messagingTemplatesUserColumnPrefs = pgTable('messaging_templates_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('messaging_templates_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);

export const exams = pgTable('exams', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  subject: varchar('subject', { length: 120 }).notNull().default(''),
  totalMarks: integer('total_marks').notNull().default(100),
  passingMarks: integer('passing_marks').notNull().default(50),
  date: varchar('date', { length: 10 }).notNull(),
  duration: integer('duration').notNull().default(60),
  status: varchar('status', { length: 20 }).notNull().default('upcoming'),
  description: text('description').notNull().default(''),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('exams_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('exams_workspace_date_idx').on(table.workspaceSubdomain, table.date),
  index('exams_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('exams_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('exams_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const examClasses = pgTable('exam_classes', {
  examId: text('exam_id').notNull(),
  classId: varchar('class_id', { length: 64 }).notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.examId, table.classId] }),
  index('exam_classes_workspace_exam_idx').on(table.workspaceSubdomain, table.examId),
  index('exam_classes_workspace_class_idx').on(table.workspaceSubdomain, table.classId),
]);

export const examResults = pgTable('exam_results', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull(),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  marksObtained: integer('marks_obtained').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('exam_results_workspace_exam_idx').on(table.workspaceSubdomain, table.examId),
  index('exam_results_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
]);

export const examsRelations = relations(exams, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [exams.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  classes: many(examClasses),
  results: many(examResults),
}));

export const examClassesRelations = relations(examClasses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [examClasses.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  exam: one(exams, {
    fields: [examClasses.workspaceSubdomain, examClasses.examId],
    references: [exams.workspaceSubdomain, exams.id],
  }),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [examResults.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  exam: one(exams, {
    fields: [examResults.workspaceSubdomain, examResults.examId],
    references: [exams.workspaceSubdomain, exams.id],
  }),
}));

export const hasanatDenoms = pgTable('hasanat_denoms', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  points: integer('points').notNull().default(0),
  color: varchar('color', { length: 64 }).notNull().default('emerald'),
  description: text('description').notNull().default(''),
  icon: varchar('icon', { length: 64 }).notNull().default('Star'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_denoms_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_denoms_workspace_active_idx').on(table.workspaceSubdomain, table.active),
]);

export const hasanatBatches = pgTable('hasanat_batches', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  denominationId: text('denomination_id').notNull(),
  denominationName: varchar('denomination_name', { length: 120 }).notNull().default(''),
  quantity: integer('quantity').notNull().default(0),
  remaining: integer('remaining').notNull().default(0),
  addedDate: varchar('added_date', { length: 10 }).notNull(),
  addedByUserId: text('added_by_user_id'),
  addedBy: varchar('added_by', { length: 120 }),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_batches_workspace_denom_idx').on(table.workspaceSubdomain, table.denominationId),
  index('hasanat_batches_workspace_added_date_idx').on(table.workspaceSubdomain, table.addedDate),
]);

export const hasanatDistributions = pgTable('hasanat_distributions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  batchId: text('batch_id').notNull(),
  denominationId: text('denomination_id').notNull(),
  denominationName: varchar('denomination_name', { length: 120 }).notNull().default(''),
  recipientType: varchar('recipient_type', { length: 20 }).notNull().default('student'),
  recipientStudentId: varchar('recipient_student_id', { length: 64 }),
  recipientTeacherId: varchar('recipient_teacher_id', { length: 64 }),
  recipientName: varchar('recipient_name', { length: 255 }).notNull().default(''),
  recipientClass: varchar('recipient_class', { length: 120 }).notNull().default(''),
  quantity: integer('quantity').notNull().default(1),
  reason: text('reason').notNull().default(''),
  issuedDate: varchar('issued_date', { length: 10 }).notNull(),
  issuedByUserId: text('issued_by_user_id'),
  issuedBy: varchar('issued_by', { length: 120 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_dist_workspace_student_idx').on(table.workspaceSubdomain, table.recipientStudentId),
  index('hasanat_dist_workspace_batch_idx').on(table.workspaceSubdomain, table.batchId),
  index('hasanat_dist_workspace_denom_idx').on(table.workspaceSubdomain, table.denominationId),
  index('hasanat_dist_workspace_issued_date_idx').on(table.workspaceSubdomain, table.issuedDate),
  index('hasanat_dist_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('hasanat_dist_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('hasanat_dist_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const hasanatRedemptions = pgTable('hasanat_redemptions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  distributionId: text('distribution_id').notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull().default(''),
  reward: text('reward').notNull().default(''),
  pointsUsed: integer('points_used').notNull().default(0),
  date: varchar('date', { length: 10 }).notNull(),
  approvedByUserId: text('approved_by_user_id'),
  approvedBy: varchar('approved_by', { length: 120 }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('hasanat_redemp_workspace_dist_idx').on(table.workspaceSubdomain, table.distributionId),
  index('hasanat_redemp_workspace_date_idx').on(table.workspaceSubdomain, table.date),
]);

export const hasanatDenomsRelations = relations(hasanatDenoms, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatDenoms.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  batches: many(hasanatBatches),
  distributions: many(hasanatDistributions),
}));

export const hasanatBatchesRelations = relations(hasanatBatches, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatBatches.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  denomination: one(hasanatDenoms, {
    fields: [hasanatBatches.workspaceSubdomain, hasanatBatches.denominationId],
    references: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
  }),
  distributions: many(hasanatDistributions),
}));

export const hasanatDistributionsRelations = relations(hasanatDistributions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatDistributions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  batch: one(hasanatBatches, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.batchId],
    references: [hasanatBatches.workspaceSubdomain, hasanatBatches.id],
  }),
  denomination: one(hasanatDenoms, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.denominationId],
    references: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
  }),
  redemptions: many(hasanatRedemptions),
}));

export const hasanatRedemptionsRelations = relations(hasanatRedemptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [hasanatRedemptions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  distribution: one(hasanatDistributions, {
    fields: [hasanatRedemptions.workspaceSubdomain, hasanatRedemptions.distributionId],
    references: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
  }),
}));

export const accountingAccounts = pgTable('accounting_accounts', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  subtype: varchar('subtype', { length: 100 }).notNull().default(''),
  description: text('description').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_accounts_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_accounts_workspace_code_idx').on(table.workspaceSubdomain, table.code),
  index('accounting_accounts_workspace_type_idx').on(table.workspaceSubdomain, table.type),
  index('accounting_accounts_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('accounting_accounts_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const accountingFiscalYears = pgTable('accounting_fiscal_years', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  label: varchar('label', { length: 120 }).notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('upcoming'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_fiscal_years_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_fiscal_years_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('accounting_fiscal_years_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('accounting_fiscal_years_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const accountingEntries = pgTable('accounting_entries', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  ref: varchar('ref', { length: 100 }).notNull().default(''),
  description: text('description').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('posted'),
  createdBy: varchar('created_by', { length: 120 }).notNull().default(''),
  fiscalYear: varchar('fiscal_year', { length: 64 }).notNull().default(''),
  transactionType: varchar('transaction_type', { length: 50 }),
  reversedRef: varchar('reversed_ref', { length: 100 }),
  simpleMode: boolean('simple_mode').notNull().default(false),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('accounting_entries_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_entries_workspace_date_idx').on(table.workspaceSubdomain, table.date),
  index('accounting_entries_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('accounting_entries_workspace_fiscal_idx').on(table.workspaceSubdomain, table.fiscalYear),
  index('accounting_entries_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('accounting_entries_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const accountingJournalLines = pgTable('accounting_journal_lines', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  entryId: text('entry_id').notNull(),
  accountId: text('account_id').notNull(),
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0'),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.entryId, table.id] }),
  index('accounting_lines_workspace_entry_idx').on(table.workspaceSubdomain, table.entryId),
  index('accounting_lines_workspace_account_idx').on(table.workspaceSubdomain, table.accountId),
]);

export const accountingEntryTags = pgTable('accounting_entry_tags', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  entryId: text('entry_id').notNull(),
  tag: varchar('tag', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.entryId, table.tag] }),
  index('accounting_entry_tags_workspace_entry_idx').on(table.workspaceSubdomain, table.entryId),
]);

export const accountingEntryAttachments = pgTable('accounting_entry_attachments', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  entryId: text('entry_id').notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.entryId, table.url] }),
  index('accounting_entry_attachments_workspace_entry_idx').on(table.workspaceSubdomain, table.entryId),
]);

export const accountingAccountsRelations = relations(accountingAccounts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [accountingAccounts.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  lines: many(accountingJournalLines),
}));

export const accountingFiscalYearsRelations = relations(accountingFiscalYears, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingFiscalYears.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const accountingEntriesRelations = relations(accountingEntries, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntries.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  lines: many(accountingJournalLines),
  tags: many(accountingEntryTags),
  attachments: many(accountingEntryAttachments),
}));

export const accountingJournalLinesRelations = relations(accountingJournalLines, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingJournalLines.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingJournalLines.workspaceSubdomain, accountingJournalLines.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
  account: one(accountingAccounts, {
    fields: [accountingJournalLines.workspaceSubdomain, accountingJournalLines.accountId],
    references: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
  }),
}));

export const accountingEntryTagsRelations = relations(accountingEntryTags, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntryTags.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingEntryTags.workspaceSubdomain, accountingEntryTags.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
}));

export const accountingEntryAttachmentsRelations = relations(accountingEntryAttachments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntryAttachments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingEntryAttachments.workspaceSubdomain, accountingEntryAttachments.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
}));

export const questions = pgTable('questions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  questionLanguage: varchar('question_language', { length: 10 }).notNull().default('en'),
  text: text('text').notNull(),
  answer: text('answer').notNull(),
  marks: integer('marks').notNull().default(1),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('questions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('questions_workspace_type_idx').on(table.workspaceSubdomain, table.type),
  index('questions_workspace_difficulty_idx').on(table.workspaceSubdomain, table.difficulty),
  index('questions_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('questions_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const questionCategories = pgTable('question_categories', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  categoryId: varchar('category_id', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.questionId, table.categoryId] }),
  index('question_categories_workspace_q_idx').on(table.workspaceSubdomain, table.questionId),
  index('question_categories_workspace_cat_idx').on(table.workspaceSubdomain, table.categoryId),
]);

export const questionOptions = pgTable('question_options', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  optionIndex: integer('option_index').notNull(),
  optionText: text('option_text').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.questionId, table.id] }),
  index('question_options_workspace_q_idx').on(table.workspaceSubdomain, table.questionId),
]);

export const questionTags = pgTable('question_tags', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  tag: varchar('tag', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.questionId, table.tag] }),
  index('question_tags_workspace_q_idx').on(table.workspaceSubdomain, table.questionId),
]);

export const questionCitations = pgTable('question_citations', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  bookId: text('book_id').notNull(),
  citation: text('citation').notNull().default('{}'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.questionId, table.id] }),
  index('question_citations_workspace_q_idx').on(table.workspaceSubdomain, table.questionId),
]);

export const tests = pgTable('tests', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: varchar('category_id', { length: 64 }),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('mixed'),
  duration: integer('duration').notNull().default(60),
  examClass: varchar('exam_class', { length: 120 }),
  totalMarks: integer('total_marks'),
  instructions: text('instructions'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('tests_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('tests_workspace_category_idx').on(table.workspaceSubdomain, table.categoryId),
  index('tests_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('tests_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const testQuestions = pgTable('test_questions', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  testId: text('test_id').notNull(),
  questionId: text('question_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.testId, table.questionId] }),
  index('test_questions_workspace_test_idx').on(table.workspaceSubdomain, table.testId),
]);

export const testSections = pgTable('test_sections', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  testId: text('test_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  instructions: text('instructions').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.testId, table.id] }),
  index('test_sections_workspace_test_idx').on(table.workspaceSubdomain, table.testId),
]);

export const testSectionQuestions = pgTable('test_section_questions', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull(),
  questionId: text('question_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sectionId, table.questionId] }),
  index('test_section_questions_workspace_sec_idx').on(table.workspaceSubdomain, table.sectionId),
]);

export const assessmentResults = pgTable('assessment_results', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  testId: text('test_id').notNull(),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull().default(''),
  submittedAt: varchar('submitted_at', { length: 30 }).notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('assessment_results_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('assessment_results_workspace_test_idx').on(table.workspaceSubdomain, table.testId),
  index('assessment_results_workspace_student_idx').on(table.workspaceSubdomain, table.studentId),
  index('assessment_results_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('assessment_results_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
]);

export const assessmentAnswers = pgTable('assessment_answers', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  resultId: text('result_id').notNull(),
  questionId: text('question_id').notNull(),
  studentAnswer: text('student_answer').notNull().default(''),
  score: numeric('score', { precision: 8, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.resultId, table.questionId] }),
  index('assessment_answers_workspace_res_idx').on(table.workspaceSubdomain, table.resultId),
]);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [questions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  categories: many(questionCategories),
  options: many(questionOptions),
  tags: many(questionTags),
  citations: many(questionCitations),
}));

export const questionCategoriesRelations = relations(questionCategories, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionCategories.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionCategories.workspaceSubdomain, questionCategories.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionOptions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionOptions.workspaceSubdomain, questionOptions.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tests.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  questions: many(testQuestions),
  sections: many(testSections),
  results: many(assessmentResults),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [assessmentResults.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  test: one(tests, {
    fields: [assessmentResults.workspaceSubdomain, assessmentResults.testId],
    references: [tests.workspaceSubdomain, tests.id],
  }),
  answers: many(assessmentAnswers),
}));

export const obligationTypesRelations = relations(obligationTypes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [obligationTypes.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  wakalaTypes: many(wakalaTypes),
  collections: many(obligationCollections),
}));

export const mujtahidsRelations = relations(mujtahids, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [mujtahids.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  reps: many(mujtahidReps),
}));

export const mujtahidRepsRelations = relations(mujtahidReps, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [mujtahidReps.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  mujtahid: one(mujtahids, {
    fields: [mujtahidReps.workspaceSubdomain, mujtahidReps.mujtahidId],
    references: [mujtahids.workspaceSubdomain, mujtahids.id],
  }),
  wakalaTypes: many(wakalaTypes),
  collections: many(obligationCollections),
}));

export const wakalaTypesRelations = relations(wakalaTypes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [wakalaTypes.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  rep: one(mujtahidReps, {
    fields: [wakalaTypes.workspaceSubdomain, wakalaTypes.mujtahidRepresentativeId],
    references: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
  }),
  obligationType: one(obligationTypes, {
    fields: [wakalaTypes.workspaceSubdomain, wakalaTypes.obligationTypeId],
    references: [obligationTypes.workspaceSubdomain, obligationTypes.id],
  }),
  distributions: many(obligationDistributions),
}));

export const obligationDistributionsRelations = relations(obligationDistributions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [obligationDistributions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  wakalaType: one(wakalaTypes, {
    fields: [obligationDistributions.workspaceSubdomain, obligationDistributions.wakalaTypeId],
    references: [wakalaTypes.workspaceSubdomain, wakalaTypes.id],
  }),
}));

export const obligationCollectionsRelations = relations(obligationCollections, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [obligationCollections.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  obligationType: one(obligationTypes, {
    fields: [obligationCollections.workspaceSubdomain, obligationCollections.obligationTypeId],
    references: [obligationTypes.workspaceSubdomain, obligationTypes.id],
  }),
  rep: one(mujtahidReps, {
    fields: [obligationCollections.workspaceSubdomain, obligationCollections.mujtahidRepresentativeId],
    references: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
  }),
}));

export const userActivityLogs = pgTable('user_activity_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 64 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  detail: text('detail').notNull().default(''),
  ts: varchar('ts', { length: 35 }).notNull(),
  ip: varchar('ip', { length: 50 }).notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('user_activity_logs_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('user_activity_logs_workspace_user_idx').on(table.workspaceSubdomain, table.userId),
  index('user_activity_logs_workspace_action_idx').on(table.workspaceSubdomain, table.action),
  index('user_activity_logs_workspace_module_idx').on(table.workspaceSubdomain, table.module),
  index('user_activity_logs_workspace_ts_idx').on(table.workspaceSubdomain, table.ts),
]);

export const auditLogEntries = pgTable('audit_log_entries', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  at: varchar('at', { length: 35 }).notNull(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  tenant: varchar('tenant', { length: 100 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('audit_log_entries_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('audit_log_entries_workspace_user_idx').on(table.workspaceSubdomain, table.userId),
  index('audit_log_entries_workspace_action_idx').on(table.workspaceSubdomain, table.action),
  index('audit_log_entries_workspace_entity_type_idx').on(table.workspaceSubdomain, table.entityType),
  index('audit_log_entries_workspace_at_idx').on(table.workspaceSubdomain, table.at),
]);

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [userActivityLogs.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const auditLogEntriesRelations = relations(auditLogEntries, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [auditLogEntries.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [contacts.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  phones: many(contactPhones),
  emails: many(contactEmails),
  addresses: many(contactAddresses),
  socials: many(contactSocials),
  educations: many(contactEducations),
  experiences: many(contactExperiences),
  skills: many(contactSkills),
  relationships: many(contactRelationships),
  activities: many(contactActivities),
  attachments: many(contactAttachments),
}));

export const contactPhonesRelations = relations(contactPhones, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactPhones.workspaceSubdomain, contactPhones.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactEmailsRelations = relations(contactEmails, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmails.workspaceSubdomain, contactEmails.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactAddressesRelations = relations(contactAddresses, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactAddresses.workspaceSubdomain, contactAddresses.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactSocialsRelations = relations(contactSocials, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSocials.workspaceSubdomain, contactSocials.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactEducationsRelations = relations(contactEducations, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEducations.workspaceSubdomain, contactEducations.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactExperiencesRelations = relations(contactExperiences, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactExperiences.workspaceSubdomain, contactExperiences.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactSkillsRelations = relations(contactSkills, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSkills.workspaceSubdomain, contactSkills.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactRelationshipsRelations = relations(contactRelationships, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactRelationships.workspaceSubdomain, contactRelationships.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactActivitiesRelations = relations(contactActivities, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactActivities.workspaceSubdomain, contactActivities.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactAttachmentsRelations = relations(contactAttachments, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactAttachments.workspaceSubdomain, contactAttachments.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [students.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [students.workspaceSubdomain, students.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  fatherContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.fatherContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  motherContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.motherContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  guardianContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.guardianContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  enrolledSessions: many(studentEnrolledSessions),
}));

export const studentEnrolledSessionsRelations = relations(studentEnrolledSessions, ({ one }) => ({
  student: one(students, {
    fields: [studentEnrolledSessions.workspaceSubdomain, studentEnrolledSessions.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
}));

export const teachersRelations = relations(teachers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [teachers.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [teachers.workspaceSubdomain, teachers.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  user: one(tenantUsers, {
    fields: [teachers.userId],
    references: [tenantUsers.id],
  }),
}));



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
  action: varchar('action', { length: 80 }).notNull(),
  targetResource: varchar('target_resource', { length: 120 }),
  targetId: varchar('target_id', { length: 64 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadataMessage: varchar('metadata_message', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('platform_activity_logs_created_at_idx').on(table.createdAt),
  index('platform_activity_logs_action_created_at_idx').on(table.action, table.createdAt),
  index('platform_activity_logs_user_created_idx').on(table.userId, table.createdAt),
]);

export const messageTemplates = pgTable('message_templates', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  labelKey: varchar('label_key', { length: 255 }),
  body: text('body').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  channel: varchar('channel', { length: 50 }).notNull().default('all'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('message_templates_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('message_templates_workspace_category_idx').on(table.workspaceSubdomain, table.category),
  index('message_templates_workspace_channel_idx').on(table.workspaceSubdomain, table.channel),
]);

export const messageLogs = pgTable('message_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().default(''),
  contactId: varchar('contact_id', { length: 64 }).notNull(),
  channel: varchar('channel', { length: 30 }).notNull(),
  body: text('body').notNull(),
  sentAt: varchar('sent_at', { length: 35 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('sent'),
  subject: varchar('subject', { length: 500 }),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  errorMessage: varchar('error_message', { length: 1000 }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('message_logs_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('message_logs_workspace_channel_idx').on(table.workspaceSubdomain, table.channel),
  index('message_logs_workspace_category_idx').on(table.workspaceSubdomain, table.category),
  index('message_logs_workspace_status_idx').on(table.workspaceSubdomain, table.status),
  index('message_logs_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('message_logs_workspace_sent_at_idx').on(table.workspaceSubdomain, table.sentAt),
  index('message_logs_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  index('message_logs_workspace_active_idx')
    .on(table.workspaceSubdomain)
    .where(sql`${table.deletedAt} is null`),
  index('message_logs_workspace_sent_at_active_idx')
    .on(table.workspaceSubdomain, table.sentAt)
    .where(sql`${table.deletedAt} is null`),
]);

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageTemplates.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const messageLogsRelations = relations(messageLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageLogs.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sessions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  classes: many(sessionClasses),
  timetable: many(sessionTimetable),
  discounts: many(sessionDiscounts),
  budgetExpenses: many(sessionBudgetExpenses),
  budgetIncomes: many(sessionBudgetIncomes),
  events: many(sessionEvents),
  tabarruk: many(sessionTabarruk),
}));

export const sessionClassesRelations = relations(sessionClasses, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionClasses.workspaceSubdomain, sessionClasses.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionTimetableRelations = relations(sessionTimetable, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTimetable.workspaceSubdomain, sessionTimetable.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionDiscountsRelations = relations(sessionDiscounts, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionDiscounts.workspaceSubdomain, sessionDiscounts.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionBudgetExpensesRelations = relations(sessionBudgetExpenses, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionBudgetExpenses.workspaceSubdomain, sessionBudgetExpenses.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionBudgetIncomesRelations = relations(sessionBudgetIncomes, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionBudgetIncomes.workspaceSubdomain, sessionBudgetIncomes.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionEventsRelations = relations(sessionEvents, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionEvents.workspaceSubdomain, sessionEvents.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionTabarrukRelations = relations(sessionTabarruk, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTabarruk.workspaceSubdomain, sessionTabarruk.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const questionBankFieldConfigs = pgTable('question_bank_field_configs', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const questionBankModulePreferences = pgTable('question_bank_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').primaryKey().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Per-user Question Bank Work column layout (was document-store `question_bank_user_column_preferences`). */
export const questionBankUserColumnPrefs = pgTable('question_bank_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
  index('question_bank_user_column_prefs_workspace_idx').on(table.workspaceSubdomain),
]);
