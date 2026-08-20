import { pgTable, text, timestamp, index, jsonb, primaryKey, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./platform.js";

export const messageTemplates = pgTable('message_templates', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  labelKey: varchar('label_key', { length: 255 }),
  body: text('body').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  channel: varchar('channel', { length: 50 }).notNull().default('all'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
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
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
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

/** Per-user Messaging recipients Work column layout (was document-store `messaging_recipients_user_column_preferences`). */
export const messagingRecipientsUserColumnPrefs = pgTable('messaging_recipients_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
]);

/** Per-user Messaging history Work column layout (was document-store `messaging_history_user_column_preferences`). */
export const messagingHistoryUserColumnPrefs = pgTable('messaging_history_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
]);

/** Per-user Messaging templates Work column layout (was document-store `messaging_templates_user_column_preferences`). */
export const messagingTemplatesUserColumnPrefs = pgTable('messaging_templates_user_column_prefs', {
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  preferences: jsonb('preferences').$type<unknown[]>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.userId] }),
]);

/* ========================================================================= */
/*                         ROW INFER TYPES                                   */
/* ========================================================================= */

export type MessageTemplateRow = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplateRow = typeof messageTemplates.$inferInsert;
export type MessageLogRow = typeof messageLogs.$inferSelect;
export type InsertMessageLogRow = typeof messageLogs.$inferInsert;
export type MessagingRecipientsUserColumnPrefsRow = typeof messagingRecipientsUserColumnPrefs.$inferSelect;
export type InsertMessagingRecipientsUserColumnPrefsRow = typeof messagingRecipientsUserColumnPrefs.$inferInsert;
export type MessagingHistoryUserColumnPrefsRow = typeof messagingHistoryUserColumnPrefs.$inferSelect;
export type InsertMessagingHistoryUserColumnPrefsRow = typeof messagingHistoryUserColumnPrefs.$inferInsert;
export type MessagingTemplatesUserColumnPrefsRow = typeof messagingTemplatesUserColumnPrefs.$inferSelect;
export type InsertMessagingTemplatesUserColumnPrefsRow = typeof messagingTemplatesUserColumnPrefs.$inferInsert;
