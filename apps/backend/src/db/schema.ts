import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, serial, primaryKey } from 'drizzle-orm/pg-core';
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

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('students_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('students_custom_data_gin_idx').using('gin', table.customData),
]);

export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('teachers_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('teachers_custom_data_gin_idx').using('gin', table.customData),
]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('sessions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('sessions_custom_data_gin_idx').using('gin', table.customData),
]);

export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('attendance_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('attendance_custom_data_gin_idx').using('gin', table.customData),
]);

export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('enrollments_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('enrollments_custom_data_gin_idx').using('gin', table.customData),
]);

export const obligationTypes = pgTable('obligation_types', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('obligation_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_types_custom_data_gin_idx').using('gin', table.customData),
]);

export const mujtahids = pgTable('mujtahids', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('mujtahids_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahids_custom_data_gin_idx').using('gin', table.customData),
]);

export const mujtahidReps = pgTable('mujtahid_reps', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('mujtahid_reps_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('mujtahid_reps_custom_data_gin_idx').using('gin', table.customData),
]);

export const wakalaTypes = pgTable('wakala_types', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('wakala_types_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('wakala_types_custom_data_gin_idx').using('gin', table.customData),
]);

export const obligationDistributions = pgTable('obligation_distributions', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('obligation_distributions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_distributions_custom_data_gin_idx').using('gin', table.customData),
]);

export const obligationCollections = pgTable('obligation_collections', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('obligation_collections_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('obligation_collections_custom_data_gin_idx').using('gin', table.customData),
]);

export const financeInvoices = pgTable('finance_invoices', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('finance_invoices_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_invoices_custom_data_gin_idx').using('gin', table.customData),
]);

export const financePayments = pgTable('finance_payments', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('finance_payments_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('finance_payments_custom_data_gin_idx').using('gin', table.customData),
]);

export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('exams_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('exams_custom_data_gin_idx').using('gin', table.customData),
]);

export const examResults = pgTable('exam_results', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('exam_results_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('exam_results_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatDenoms = pgTable('hasanat_denoms', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('hasanat_denoms_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_denoms_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatBatches = pgTable('hasanat_batches', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('hasanat_batches_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_batches_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatDistributions = pgTable('hasanat_distributions', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('hasanat_distributions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_distributions_custom_data_gin_idx').using('gin', table.customData),
]);

export const hasanatRedemptions = pgTable('hasanat_redemptions', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('hasanat_redemptions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('hasanat_redemptions_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingAccounts = pgTable('accounting_accounts', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('accounting_accounts_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_accounts_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingEntries = pgTable('accounting_entries', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('accounting_entries_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_entries_custom_data_gin_idx').using('gin', table.customData),
]);

export const accountingFiscalYears = pgTable('accounting_fiscal_years', {
  id: text('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('accounting_fiscal_years_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('accounting_fiscal_years_custom_data_gin_idx').using('gin', table.customData),
]);

export const questions = pgTable('questions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('questions_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('questions_custom_data_gin_idx').using('gin', table.customData),
]);

export const tests = pgTable('tests', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('tests_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('tests_custom_data_gin_idx').using('gin', table.customData),
]);

export const assessmentResults = pgTable('assessment_results', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('assessment_results_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('assessment_results_custom_data_gin_idx').using('gin', table.customData),
]);

export const userActivityLogs = pgTable('user_activity_logs', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
  customData: jsonb('custom_data').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('user_activity_logs_workspace_subdomain_idx').on(table.workspaceSubdomain),
  index('user_activity_logs_custom_data_gin_idx').using('gin', table.customData),
]);

export const auditLogEntries = pgTable('audit_log_entries', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull(),
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
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: text('user_id'),
  changedAt: timestamp('changed_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_table_record_idx').on(table.tableName, table.recordId),
]);

export const customTabs = pgTable('custom_tabs', {
  id: text('id').primaryKey(), // e.g. subdomain:moduleId:key
  workspaceSubdomain: text('workspace_subdomain').notNull(),
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
  uniqueIndex('custom_tabs_workspace_module_key_idx').on(table.workspaceSubdomain, table.moduleId, table.key),
  index('custom_tabs_workspace_idx').on(table.workspaceSubdomain),
]);


