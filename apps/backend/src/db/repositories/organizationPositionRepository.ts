/**
 * @file organizationPositionRepository.ts
 * @description CRUD operations for tenant organization positions.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { OrganizationPositionInsert, OrganizationPositionUpdate } from '@mms/shared';
import { facultyAssignments, organizationPositions } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import type { OrganizationPositionRow } from '../schema/organizationPositionTables.js';
import { checkPositionCycleSafe } from './organizationPositionHierarchyRepository.js';

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
  filter?: { departmentId?: string; locationId?: string },
): Promise<OrganizationPositionRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const conditions = [
      eq(organizationPositions.workspaceSubdomain, subdomain),
      isNull(organizationPositions.deletedAt),
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
    const [inserted] = await tx
      .insert(organizationPositions)
      .values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        departmentId: data.departmentId,
        designationId: data.designationId,
        locationId: data.locationId ?? null,
        parentPositionId: data.parentPositionId ?? null,
        capacity: data.capacity ?? 1,
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
  if (data.parentPositionId) {
    const cycleCheck = await checkPositionCycleSafe(subdomain, id, data.parentPositionId);
    if (!cycleCheck.safe) {
      throw new Error(cycleCheck.reason ?? 'Cycle detected in position hierarchy');
    }
  }

  return withTenant(subdomain, async (tx) => {
    const updatePayload: Partial<typeof organizationPositions.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userId ?? null,
    };
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId;
    if (data.designationId !== undefined) updatePayload.designationId = data.designationId;
    if (data.locationId !== undefined) updatePayload.locationId = data.locationId ?? null;
    if (data.parentPositionId !== undefined) updatePayload.parentPositionId = data.parentPositionId ?? null;
    if (data.capacity !== undefined) updatePayload.capacity = data.capacity;

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
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    // Check if any active faculty assignment occupies this position
    const activeOccupants = await tx
      .select({ id: facultyAssignments.id })
      .from(facultyAssignments)
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.positionId, id),
          isNull(facultyAssignments.deletedAt),
          isNull(facultyAssignments.endDate),
        ),
      )
      .limit(1);

    if (activeOccupants.length > 0) {
      return {
        success: false,
        reason: 'Cannot delete position that currently has active staff assignments',
      };
    }

    const [deleted] = await tx
      .update(organizationPositions)
      .set({
        deletedAt: new Date(),
        deletedBy: userId ?? null,
      })
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain), eq(organizationPositions.id, id), isNull(organizationPositions.deletedAt)))
      .returning({ id: organizationPositions.id });

    return { success: Boolean(deleted) };
  });
}
