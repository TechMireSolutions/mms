import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, primaryKey, foreignKey, varchar, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";

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
  avatar: text('avatar'),
  notes: text('notes'),
  whatsappStatus: varchar('whatsapp_status', { length: 30 }).notNull().default('unknown'),
  lastCheckedAt: varchar('last_checked_at', { length: 35 }),
  preferredLanguage: varchar('preferred_language', { length: 50 }),
  preferredContactMethod: varchar('preferred_contact_method', { length: 50 }),
  doNotContact: boolean('do_not_contact').notNull().default(false),
  aiSummary: text('ai_summary'),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('contacts_workspace_name_idx').on(table.workspaceSubdomain, table.name),
  index('contacts_workspace_first_name_idx').on(table.workspaceSubdomain, table.firstName),
  index('contacts_workspace_last_name_idx').on(table.workspaceSubdomain, table.lastName),
  index('contacts_workspace_cnic_idx').on(table.workspaceSubdomain, table.cnic),
  index('contacts_workspace_gender_idx').on(table.workspaceSubdomain, table.gender),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_phones_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_phones_workspace_number_idx').on(table.workspaceSubdomain, table.number),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_emails_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_emails_workspace_address_idx').on(table.workspaceSubdomain, table.address),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_addresses_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
]);
export const contactTags = pgTable('contact_tags', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_tags_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  uniqueIndex('contact_tags_contact_name_uidx').on(table.workspaceSubdomain, table.contactId, table.name),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
]);

export const contactSocials = pgTable('contact_socials', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_socials_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_educations_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_experiences_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_skills_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_relationships_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  index('contact_relationships_workspace_related_idx').on(table.workspaceSubdomain, table.relatedContactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_activities_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.contactId, table.id] }),
  index('contact_attachments_workspace_contact_idx').on(table.workspaceSubdomain, table.contactId),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('cascade'),
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
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'date' }),
  pendingLoginEmail: text('pending_login_email'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  /** Non-auth profile fields from legacy JSON user rows. */
  profileJson: jsonb('profile_json').$type<Record<string, unknown>>(),
}, (table) => [
  unique('tenant_users_workspace_subdomain_id_uniq').on(table.workspaceSubdomain, table.id),
  uniqueIndex('tenant_users_workspace_login_email_active_idx')
    .on(table.workspaceSubdomain, table.loginEmail)
    .where(sql`${table.deletedAt} is null`),
  index('tenant_users_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt),
  foreignKey({
    columns: [table.workspaceSubdomain, table.contactId],
    foreignColumns: [contacts.workspaceSubdomain, contacts.id],
  }).onDelete('set null'),
]);

/** Per-user Google Contacts OAuth credentials — never stored in objects KV. */
export const contactGoogleSyncCredentials = pgTable('contact_google_sync_credentials', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  clientId: text('client_id'),
  clientSecret: text('client_secret'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
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
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
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
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Contacts Setup preferences (was document-store `contact_preferences`). */
export const contactModulePreferences = pgTable('contact_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Contacts Work column layout (was document-store `contact_user_column_preferences`). */
/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type ContactRow = typeof contacts.$inferSelect;
export type InsertContactRow = typeof contacts.$inferInsert;
export type ContactPhoneRow = typeof contactPhones.$inferSelect;
export type InsertContactPhoneRow = typeof contactPhones.$inferInsert;
export type ContactEmailRow = typeof contactEmails.$inferSelect;
export type InsertContactEmailRow = typeof contactEmails.$inferInsert;
export type ContactAddressRow = typeof contactAddresses.$inferSelect;
export type InsertContactAddressRow = typeof contactAddresses.$inferInsert;
export type ContactSocialRow = typeof contactSocials.$inferSelect;
export type InsertContactSocialRow = typeof contactSocials.$inferInsert;
export type ContactEducationRow = typeof contactEducations.$inferSelect;
export type InsertContactEducationRow = typeof contactEducations.$inferInsert;
export type ContactExperienceRow = typeof contactExperiences.$inferSelect;
export type InsertContactExperienceRow = typeof contactExperiences.$inferInsert;
export type ContactSkillRow = typeof contactSkills.$inferSelect;
export type InsertContactSkillRow = typeof contactSkills.$inferInsert;

export type ContactTagRow = typeof contactTags.$inferSelect;
export type InsertContactTagRow = typeof contactTags.$inferInsert;
export type ContactRelationshipRow = typeof contactRelationships.$inferSelect;
export type InsertContactRelationshipRow = typeof contactRelationships.$inferInsert;
export type ContactActivityRow = typeof contactActivities.$inferSelect;
export type InsertContactActivityRow = typeof contactActivities.$inferInsert;
export type ContactAttachmentRow = typeof contactAttachments.$inferSelect;
export type InsertContactAttachmentRow = typeof contactAttachments.$inferInsert;
export type TenantUserRow = typeof tenantUsers.$inferSelect;
export type InsertTenantUserRow = typeof tenantUsers.$inferInsert;
export type ContactGoogleSyncCredentialRow = typeof contactGoogleSyncCredentials.$inferSelect;
export type InsertContactGoogleSyncCredentialRow = typeof contactGoogleSyncCredentials.$inferInsert;
export type ContactLookupsRow = typeof contactLookups.$inferSelect;
export type InsertContactLookupsRow = typeof contactLookups.$inferInsert;
export type ContactFieldConfigsRow = typeof contactFieldConfigs.$inferSelect;
export type InsertContactFieldConfigsRow = typeof contactFieldConfigs.$inferInsert;
export type ContactModulePreferencesRow = typeof contactModulePreferences.$inferSelect;
export type InsertContactModulePreferencesRow = typeof contactModulePreferences.$inferInsert;
