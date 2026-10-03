/**
 * @file organizationPositionRepository.ts
 * @description CRUD operations for tenant organization positions.
 */

import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import type { OrganizationPositionInsert, OrganizationPositionUpdate } from '@mms/shared';
import { organizationPositions } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import type { OrganizationPositionRow } from '../schema/organizationPositionTables.js';
import { validateOrganizationParent } from './organizationHierarchyValidation.js';

const SELECT_COLS = {
  id: organizationPositions.id,
  workspaceSubdomain: organizationPositions.workspaceSubdomain,
  code: organizationPositions.code,
  name: organizationPositions.name,
  departmentId: organizationPositions.departmentId,
  designationId: organizationPositions.designationId,
  locationId: organizationPositions.locationId,
  parentPositionId: organizationPositions.parentPositionId,
  capacity: organizationPositions.capacity,
  sortOrder: organizationPositions.sortOrder,
  isActive: organizationPositions.isActive,
  deletedAt: organizationPositions.deletedAt,
  deletedBy: organizationPositions.deletedBy,
  deletionReason: organizationPositions.deletionReason,
  restoredAt: organizationPositions.restoredAt,
  restoredBy: organizationPositions.restoredBy,
  deletedWithCascade: organizationPositions.deletedWithCascade,
  createdAt: organizationPositions.createdAt,
  updatedAt: organizationPositions.updatedAt,
  createdBy: organizationPositions.createdBy,
  updatedBy: organizationPositions.updatedBy,
} as const;

export async function listOrganizationPositions(
  tenant: string,
  filter?: { departmentId?: string; locationId?: string; includeDeleted?: boolean },
): Promise<OrganizationPositionRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const conditions = [
      eq(organizationPositions.workspaceSubdomain, subdomain),
      filter?.includeDeleted
        ? isNotNull(organizationPositions.deletedAt)
        : isNull(organizationPositions.deletedAt),
    ];
    if (filter?.departmentId) {
      conditions.push(eq(organizationPositions.departmentId, filter.departmentId));
    }
    if (filter?.locationId) {
      conditions.push(eq(organizationPositions.locationId, filter.locationId));
    }

    return tx
      .select(SELECT_COLS)
      .from(organizationPositions)
      .where(and(...conditions))
      .orderBy(organizationPositions.name);
  });
}

export async function findOrganizationPositionById(
  tenant: string,
  id: string,
): Promise<OrganizationPositionRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(SELECT_COLS)
      .from(organizationPositions)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain), eq(organizationPositions.id, id), isNull(organizationPositions.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function createOrganizationPosition(
  tenant: string,
  data: OrganizationPositionInsert,
  userId?: string,
): Promise<OrganizationPositionRow> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await validateOrganizationParent(tx, subdomain, 'position', '', data.parentPositionId);
    const [inserted] = await tx
      .insert(organizationPositions)
      .values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        locationId: data.locationId ?? null,
        parentPositionId: data.parentPositionId ?? null,
        capacity: data.capacity ?? 1,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();
    return inserted;
  });
}

export async function updateOrganizationPosition(
  tenant: string,
  id: string,
  data: OrganizationPositionUpdate,
  userId?: string,
): Promise<OrganizationPositionRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await validateOrganizationParent(tx, subdomain, 'position', id, data.parentPositionId);
    const updatePayload: Partial<typeof organizationPositions.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userId ?? null,
    };
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId ?? null;
    if (data.designationId !== undefined) updatePayload.designationId = data.designationId ?? null;
    if (data.locationId !== undefined) updatePayload.locationId = data.locationId ?? null;
    if (data.parentPositionId !== undefined) updatePayload.parentPositionId = data.parentPositionId ?? null;
    if (data.capacity !== undefined) updatePayload.capacity = data.capacity;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const [updated] = await tx
      .update(organizationPositions)
      .set(updatePayload)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain), eq(organizationPositions.id, id), isNull(organizationPositions.deletedAt)))
      .returning();
    return updated ?? null;
  });
}

export async function deleteOrganizationPosition(
  tenant: string,
  id: string,
  userId?: string,
): Promise<{ success: boolean; reason?: string }> {
  const { archiveOrganizationPosition } = await import('./organizationTrashRepository.js');
  return archiveOrganizationPosition(tenant, id, userId);
}
