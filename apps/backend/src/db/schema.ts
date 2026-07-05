import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import type { PlatformRole } from '@mms/shared';

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
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('auth_artifacts_kind_expires_idx').on(table.kind, table.expiresAt),
]);

/** Apex platform super-users — not tenant-scoped. */
export const platformUsers = pgTable('platform_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
  role: text('role').$type<PlatformRole>().notNull().default('admin'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('platform_users_email_idx').on(table.email),
]);

/** Madrasa workspace auth users — isolated per subdomain. */
export const tenantUsers = pgTable('tenant_users', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  loginEmail: text('login_email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('assistant_teacher'),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
  pendingLoginEmail: text('pending_login_email'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  /** Non-auth profile fields from legacy JSON user rows. */
  profileJson: jsonb('profile_json').$type<Record<string, unknown>>(),
}, (table) => [
  uniqueIndex('tenant_users_workspace_login_email_idx').on(table.workspaceSubdomain, table.loginEmail),
  index('tenant_users_workspace_idx').on(table.workspaceSubdomain),
]);

export const dataMigrations = pgTable('data_migrations', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { mode: 'date' }).notNull().defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('contacts_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('contacts_custom_data_gin_idx').using('gin', table.customData),
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

