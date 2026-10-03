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
import { facultyDepartments } from './facultyDepartmentTables.js';
import { facultyDesignations } from './facultyDesignationTables.js';
import { organizationLocations } from './organizationLocationTables.js';
import { softDeleteColumns } from './softDeleteSchema.js';

/**
 * Organization positions: canonical structural reporting hierarchy.
 * Positions exist independently of human occupants.
 */
export const organizationPositions = pgTable('organization_positions', {
  id: text('id').notNull(),
  workspaceSubdomain: text('workspace_subdomain')
    .notNull()
    .references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: text('department_id'),
  designationId: text('designation_id'),
  locationId: text('location_id'),
  parentPositionId: text('parent_position_id'),
  capacity: integer('capacity').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...softDeleteColumns,
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),

  uniqueIndex('organization_positions_ws_code_active_uidx')
    .on(table.workspaceSubdomain, table.code)
    .where(sql`${table.deletedAt} is null`),

  index('organization_positions_parent_active_idx')
    .on(table.workspaceSubdomain, table.parentPositionId)
    .where(sql`${table.deletedAt} is null`),

  index('organization_positions_dept_active_idx')
    .on(table.workspaceSubdomain, table.departmentId)
    .where(sql`${table.deletedAt} is null`),

  index('organization_positions_location_active_idx')
    .on(table.workspaceSubdomain, table.locationId)
    .where(sql`${table.deletedAt} is null`),

  index('organization_positions_deleted_idx')
    .on(table.workspaceSubdomain, table.deletedAt)
    .where(sql`${table.deletedAt} is not null`),

  check('organization_positions_capacity_check', sql`${table.capacity} >= 1`),

  check(
    'organization_positions_no_self_parent_check',
    sql`${table.parentPositionId} is null or ${table.parentPositionId} <> ${table.id}`,
  ),

  foreignKey({
    columns: [table.workspaceSubdomain, table.departmentId],
    foreignColumns: [facultyDepartments.workspaceSubdomain, facultyDepartments.id],
  }).onDelete('restrict'),

  foreignKey({
    columns: [table.workspaceSubdomain, table.designationId],
    foreignColumns: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }).onDelete('restrict'),

  foreignKey({
    columns: [table.workspaceSubdomain, table.locationId],
    foreignColumns: [organizationLocations.workspaceSubdomain, organizationLocations.id],
  }).onDelete('restrict'),

  foreignKey({
    columns: [table.workspaceSubdomain, table.parentPositionId],
    foreignColumns: [table.workspaceSubdomain, table.id],
  }).onDelete('restrict'),
]);

export type OrganizationPositionRow = typeof organizationPositions.$inferSelect;
export type InsertOrganizationPositionRow = typeof organizationPositions.$inferInsert;
