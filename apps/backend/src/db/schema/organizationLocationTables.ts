import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  primaryKey,
  foreignKey,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces } from './platform.js';
import { softDeleteColumns } from './softDeleteSchema.js';

/**
 * Physical operational locations / branches / campuses inside a tenant.
 */
export const organizationLocations = pgTable('organization_locations', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain')
    .notNull()
    .references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('branch'),
  parentLocationId: text('parent_location_id'),
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  timezone: varchar('timezone', { length: 50 }),
  isHeadOffice: boolean('is_head_office').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),

  uniqueIndex('organization_locations_ws_code_active_uidx')
    .on(table.workspaceSubdomain, table.code)
    .where(sql`${table.deletedAt} is null`),

  index('organization_locations_parent_active_idx')
    .on(table.workspaceSubdomain, table.parentLocationId)
    .where(sql`${table.deletedAt} is null`),

  index('organization_locations_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),

  check(
    'organization_locations_no_self_parent_check',
    sql`${table.parentLocationId} is null or ${table.parentLocationId} <> ${table.id}`,
  ),

  foreignKey({
    columns: [table.workspaceSubdomain, table.parentLocationId],
    foreignColumns: [table.workspaceSubdomain, table.id],
  }).onDelete('restrict'),
]);

export type OrganizationLocationRow = typeof organizationLocations.$inferSelect;
export type InsertOrganizationLocationRow = typeof organizationLocations.$inferInsert;
