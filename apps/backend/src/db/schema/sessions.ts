import { pgTable, text, timestamp, uniqueIndex, index, integer, boolean, jsonb, primaryKey, foreignKey, varchar, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";

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
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.sessionId, table.id] }),
  foreignKey({
    columns: [table.workspaceSubdomain, table.sessionId],
    foreignColumns: [sessions.workspaceSubdomain, sessions.id],
  }).onDelete('cascade'),
  index('session_tabarruk_workspace_session_idx').on(table.workspaceSubdomain, table.sessionId),
]);

export const sessionLookups = pgTable('session_lookups', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'statuses' | 'types'
  label: text('label').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
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
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Sessions Setup preferences (was document-store `sessions_settings` prefs slice). */
export const sessionModulePreferences = pgTable('session_module_preferences', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain] }),
]);

/** Per-user Sessions Work column layout (was document-store `session_user_column_preferences`). */
/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type SessionRow = typeof sessions.$inferSelect;
export type InsertSessionRow = typeof sessions.$inferInsert;
export type SessionClassRow = typeof sessionClasses.$inferSelect;
export type InsertSessionClassRow = typeof sessionClasses.$inferInsert;
export type SessionTimetableRow = typeof sessionTimetable.$inferSelect;
export type InsertSessionTimetableRow = typeof sessionTimetable.$inferInsert;
export type SessionDiscountRow = typeof sessionDiscounts.$inferSelect;
export type InsertSessionDiscountRow = typeof sessionDiscounts.$inferInsert;
export type SessionBudgetExpenseRow = typeof sessionBudgetExpenses.$inferSelect;
export type InsertSessionBudgetExpenseRow = typeof sessionBudgetExpenses.$inferInsert;
export type SessionBudgetIncomeRow = typeof sessionBudgetIncomes.$inferSelect;
export type InsertSessionBudgetIncomeRow = typeof sessionBudgetIncomes.$inferInsert;
export type SessionEventRow = typeof sessionEvents.$inferSelect;
export type InsertSessionEventRow = typeof sessionEvents.$inferInsert;
export type SessionTabarrukRow = typeof sessionTabarruk.$inferSelect;
export type InsertSessionTabarrukRow = typeof sessionTabarruk.$inferInsert;
export type SessionLookupsRow = typeof sessionLookups.$inferSelect;
export type InsertSessionLookupsRow = typeof sessionLookups.$inferInsert;
export type SessionFieldConfigsRow = typeof sessionFieldConfigs.$inferSelect;
export type InsertSessionFieldConfigsRow = typeof sessionFieldConfigs.$inferInsert;
export type SessionModulePreferencesRow = typeof sessionModulePreferences.$inferSelect;
export type InsertSessionModulePreferencesRow = typeof sessionModulePreferences.$inferInsert;
