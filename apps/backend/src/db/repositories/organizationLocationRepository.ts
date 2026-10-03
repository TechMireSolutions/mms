/**
 * @file organizationLocationRepository.ts
 * @description CRUD operations for tenant organization locations.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { OrganizationLocationInsert, OrganizationLocationUpdate } from '@mms/shared';
import { organizationLocations } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import type { OrganizationLocationRow } from '../schema/organizationLocationTables.js';

const SELECT_COLS = {
  id: organizationLocations.id,
  workspaceSubdomain: organizationLocations.workspaceSubdomain,
  code: organizationLocations.code,
  name: organizationLocations.name,
  type: organizationLocations.type,
  parentLocationId: organizationLocations.parentLocationId,
  addressLine1: organizationLocations.addressLine1,
  addressLine2: organizationLocations.addressLine2,
  city: organizationLocations.city,
  region: organizationLocations.region,
  country: organizationLocations.country,
  postalCode: organizationLocations.postalCode,
  timezone: organizationLocations.timezone,
  isHeadOffice: organizationLocations.isHeadOffice,
  isActive: organizationLocations.isActive,
  sortOrder: organizationLocations.sortOrder,
  deletedAt: organizationLocations.deletedAt,
  deletedBy: organizationLocations.deletedBy,
  deletionReason: organizationLocations.deletionReason,
  restoredAt: organizationLocations.restoredAt,
  restoredBy: organizationLocations.restoredBy,
  deletedWithCascade: organizationLocations.deletedWithCascade,
  createdAt: organizationLocations.createdAt,
  updatedAt: organizationLocations.updatedAt,
  createdBy: organizationLocations.createdBy,
  updatedBy: organizationLocations.updatedBy,
} as const;

export async function listOrganizationLocations(
  tenant: string,
): Promise<OrganizationLocationRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    return tx
      .select(SELECT_COLS)
      .from(organizationLocations)
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain), isNull(organizationLocations.deletedAt)))
      .orderBy(organizationLocations.name);
  });
}

export async function findOrganizationLocationById(
  tenant: string,
  id: string,
): Promise<OrganizationLocationRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(SELECT_COLS)
      .from(organizationLocations)
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain), eq(organizationLocations.id, id), isNull(organizationLocations.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function createOrganizationLocation(
  tenant: string,
  data: OrganizationLocationInsert,
  userId?: string,
): Promise<OrganizationLocationRow> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const [inserted] = await tx
      .insert(organizationLocations)
      .values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        type: data.type,
        parentLocationId: data.parentLocationId ?? null,
        addressLine1: data.address?.trim() ?? null,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();
    return inserted;
  });
}

export async function updateOrganizationLocation(
  tenant: string,
  id: string,
  data: OrganizationLocationUpdate,
  userId?: string,
): Promise<OrganizationLocationRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const updatePayload: Partial<typeof organizationLocations.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userId ?? null,
    };
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.parentLocationId !== undefined) updatePayload.parentLocationId = data.parentLocationId ?? null;
    if (data.address !== undefined) updatePayload.addressLine1 = data.address?.trim() ?? null;

    const [updated] = await tx
      .update(organizationLocations)
      .set(updatePayload)
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain), eq(organizationLocations.id, id), isNull(organizationLocations.deletedAt)))
      .returning();
    return updated ?? null;
  });
}

export async function deleteOrganizationLocation(
  tenant: string,
  id: string,
  userId?: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const [deleted] = await tx
      .update(organizationLocations)
      .set({
        deletedAt: new Date(),
        deletedBy: userId ?? null,
      })
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain), eq(organizationLocations.id, id), isNull(organizationLocations.deletedAt)))
      .returning({ id: organizationLocations.id });
    return Boolean(deleted);
  });
}
