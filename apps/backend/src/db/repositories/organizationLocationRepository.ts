/**
 * @file organizationLocationRepository.ts
 * @description CRUD operations for tenant organization locations.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { OrganizationLocationInsert, OrganizationLocationUpdate } from '@mms/shared';
import { organizationLocations } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { validateOrganizationParent } from './organizationHierarchyValidation.js';
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
    await validateOrganizationParent(tx, subdomain, 'location', '', data.parentLocationId);
    const [inserted] = await tx
      .insert(organizationLocations)
      .values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        type: data.type,
        parentLocationId: data.parentLocationId ?? null,
        addressLine1: data.addressLine1?.trim() ?? null,
        addressLine2: data.addressLine2?.trim() ?? null,
        city: data.city?.trim() ?? null,
        region: data.region?.trim() ?? null,
        country: data.country?.trim() ?? null,
        postalCode: data.postalCode?.trim() ?? null,
        timezone: data.timezone?.trim() ?? null,
        isHeadOffice: data.isHeadOffice ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
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
    await validateOrganizationParent(tx, subdomain, 'location', id, data.parentLocationId);
    const updatePayload: Partial<typeof organizationLocations.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userId ?? null,
    };
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.parentLocationId !== undefined) updatePayload.parentLocationId = data.parentLocationId ?? null;
    if (data.addressLine1 !== undefined) updatePayload.addressLine1 = data.addressLine1?.trim() ?? null;
    if (data.addressLine2 !== undefined) updatePayload.addressLine2 = data.addressLine2?.trim() ?? null;
    if (data.city !== undefined) updatePayload.city = data.city?.trim() ?? null;
    if (data.region !== undefined) updatePayload.region = data.region?.trim() ?? null;
    if (data.country !== undefined) updatePayload.country = data.country?.trim() ?? null;
    if (data.postalCode !== undefined) updatePayload.postalCode = data.postalCode?.trim() ?? null;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone?.trim() ?? null;
    if (data.isHeadOffice !== undefined) updatePayload.isHeadOffice = data.isHeadOffice;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

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
  const { archiveOrganizationLocation } = await import('./organizationTrashRepository.js');
  const result = await archiveOrganizationLocation(tenant, id, userId);
  if (!result.success && result.reason) throw new Error(result.reason);
  return result.success;
}
