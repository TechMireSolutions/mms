import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, primaryKey, varchar, bigint, foreignKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { PersistedSavedReportCategory } from "@mms/shared";
import { workspaces } from "./platform.js";
import { tenantUsers } from "./contacts.js";

export const collections = pgTable('collections', {
  name: text('name').primaryKey(),
  data: jsonb('data').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const objects = pgTable('objects', {
  key: text('key').primaryKey(),
  data: jsonb('data').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
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
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('auth_artifacts_kind_expires_idx').on(table.kind, table.expiresAt),
  uniqueIndex('auth_artifacts_lookup_key_uidx')
  .on(table.lookupKey)
  .where(sql`${table.lookupKey} is not null`),
  index('auth_artifacts_scope_key_idx')
  .on(table.scopeKey)
  .where(sql`${table.scopeKey} is not null`),
]);

export const backgroundJobs = pgTable('background_jobs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),
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
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tenantId, table.userId],
    foreignColumns: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }).onDelete('cascade'),
  index('background_jobs_tenant_user_idx').on(table.tenantId, table.userId),
  index('background_jobs_status_idx').on(table.status),
]);

/** Report presets — generic modules + Contacts (`category = 'contacts'`). */
export const savedReports = pgTable('saved_reports', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  category: text('category').$type<PersistedSavedReportCategory>().notNull(),
  name: text('name').notNull(),
  filters: jsonb('filters').$type<Record<string, unknown>>().notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdBy: text('created_by').notNull(),
  createdByName: text('created_by_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('saved_reports_workspace_category_creator_idx').on(
    table.workspaceSubdomain,
    table.category,
    table.createdBy,
  ),
]);

export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  workspaceSubdomain: text('workspace_subdomain'),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: text('user_id'),
  changedAt: timestamp('changed_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_workspace_changed_idx').on(table.workspaceSubdomain, table.changedAt),
  index('audit_logs_table_record_idx').on(table.tableName, table.recordId),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('audit_log_entries_workspace_user_idx').on(table.workspaceSubdomain, table.userId),
  index('audit_log_entries_workspace_action_idx').on(table.workspaceSubdomain, table.action),
  index('audit_log_entries_workspace_entity_type_idx').on(table.workspaceSubdomain, table.entityType),
  index('audit_log_entries_workspace_at_idx').on(table.workspaceSubdomain, table.at),
]);

export const userActivityLogs = pgTable('user_activity_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 64 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  detail: text('detail').notNull().default(''),
  ts: varchar('ts', { length: 35 }).notNull(),
  ip: varchar('ip', { length: 50 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('user_activity_logs_workspace_user_idx').on(table.workspaceSubdomain, table.userId),
  index('user_activity_logs_workspace_action_idx').on(table.workspaceSubdomain, table.action),
  index('user_activity_logs_workspace_module_idx').on(table.workspaceSubdomain, table.module),
  index('user_activity_logs_workspace_ts_idx').on(table.workspaceSubdomain, table.ts),
]);

export const dataMigrations = pgTable('data_migrations', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type CollectionRow = typeof collections.$inferSelect;
export type InsertCollectionRow = typeof collections.$inferInsert;
export type ObjectRow = typeof objects.$inferSelect;
export type InsertObjectRow = typeof objects.$inferInsert;
export type AuthArtifactRow = typeof authArtifacts.$inferSelect;
export type InsertAuthArtifactRow = typeof authArtifacts.$inferInsert;
export type BackgroundJobRow = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJobRow = typeof backgroundJobs.$inferInsert;
export type SavedReportRow = typeof savedReports.$inferSelect;
export type InsertSavedReportRow = typeof savedReports.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type InsertAuditLogRow = typeof auditLogs.$inferInsert;
export type AuditLogEntryRow = typeof auditLogEntries.$inferSelect;
export type InsertAuditLogEntryRow = typeof auditLogEntries.$inferInsert;
export type UserActivityLogRow = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLogRow = typeof userActivityLogs.$inferInsert;
export type DataMigrationRow = typeof dataMigrations.$inferSelect;
export type InsertDataMigrationRow = typeof dataMigrations.$inferInsert;
