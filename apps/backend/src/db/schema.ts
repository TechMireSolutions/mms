import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
});
