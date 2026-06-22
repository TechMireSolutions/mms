import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
  name: text('name').primaryKey(),
  data: text('data').notNull(),
});

export const objects = pgTable('objects', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
});

/** Ephemeral auth state: handoffs, 2FA challenges, refresh tokens. */
export const authArtifacts = pgTable('auth_artifacts', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  payload: text('payload').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('auth_artifacts_kind_expires_idx').on(table.kind, table.expiresAt),
]);

/** Apex platform super-users — not tenant-scoped. */
export const platformUsers = pgTable('platform_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
  contactId: text('contact_id'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  pendingLoginEmail: text('pending_login_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** Non-auth profile fields from legacy JSON user rows. */
  profileJson: text('profile_json'),
}, (table) => [
  uniqueIndex('tenant_users_workspace_login_email_idx').on(table.workspaceSubdomain, table.loginEmail),
  index('tenant_users_workspace_idx').on(table.workspaceSubdomain),
]);
