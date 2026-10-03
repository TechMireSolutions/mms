/**
 * @file organizationTrashRepository.ts
 * @description Soft-delete / restore for organization locations and positions.
 */

import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { organizationLocations, organizationPositions, facultyAssignments } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';
import { recordModernAuditEvent } from '../../services/auditTrailService.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { findOrganizationLocationById } from './organizationLocationRepository.js';
import { findOrganizationPositionById } from './organizationPositionRepository.js';

const SOFT_DELETE_PATCH = (now: Date, actorUserId?: string, reason?: string) => ({
  deletedAt: now,
  deletedBy: actorUserId ?? null,
  deletionReason: reason ?? null,
  restoredAt: null,
  restoredBy: null,
  deletedWithCascade: false,
  updatedAt: now,
});

const RESTORE_PATCH = (now: Date, actorUserId: string) => ({
  deletedAt: null,
  deletedBy: null,
  deletionReason: null,
  restoredAt: now,
  restoredBy: actorUserId,
  deletedWithCascade: false,
  updatedAt: now,
});

export async function archiveOrganizationLocation(
  tenant: string, id: string, actorUserId?: string, reason?: string,
): Promise<{ success: boolean; reason?: string }> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const children = await tx.select({ id: organizationLocations.id }).from(organizationLocations)
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain),
        eq(organizationLocations.parentLocationId, id), isNull(organizationLocations.deletedAt))).limit(1);
    const positions = await tx.select({ id: organizationPositions.id }).from(organizationPositions)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain),
        eq(organizationPositions.locationId, id), isNull(organizationPositions.deletedAt))).limit(1);
    if (children.length || positions.length) return { success: false, reason: 'Location has active dependents' };
    const now = new Date();
    const [changed] = await tx.update(organizationLocations)
      .set(SOFT_DELETE_PATCH(now, actorUserId, reason))
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain),
        eq(organizationLocations.id, id), isNull(organizationLocations.deletedAt)))
      .returning({ id: organizationLocations.id });
    if (!changed) return { success: false };
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain, tableName: 'organization_locations', recordId: id,
      actionType: 'DELETE', realUserId: actorUserId, newState: { reason: reason ?? null },
    });
    await emitOutboxEvent(tx, 'entity.soft_deleted', {
      entityType: 'organization_locations', entityId: id, tenantId: subdomain,
      deletedAt: now.toISOString(), deletedBy: actorUserId ?? 'system',
      deletionReason: reason, version: now.getTime(),
    });
    return { success: true };
  });
}

export async function archiveOrganizationPosition(
  tenant: string, id: string, actorUserId?: string, reason?: string,
): Promise<{ success: boolean; reason?: string }> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const children = await tx.select({ id: organizationPositions.id }).from(organizationPositions)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain),
        eq(organizationPositions.parentPositionId, id), isNull(organizationPositions.deletedAt))).limit(1);
    if (children.length) return { success: false, reason: 'Position has active child positions' };
    const occupants = await tx.select({ id: facultyAssignments.id }).from(facultyAssignments)
      .where(and(eq(facultyAssignments.workspaceSubdomain, subdomain),
        eq(facultyAssignments.positionId, id), isNull(facultyAssignments.deletedAt))).limit(1);
    if (occupants.length) {
      return { success: false, reason: 'Cannot delete position that currently has active staff assignments' };
    }
    const now = new Date();
    const [changed] = await tx.update(organizationPositions)
      .set(SOFT_DELETE_PATCH(now, actorUserId, reason))
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain),
        eq(organizationPositions.id, id), isNull(organizationPositions.deletedAt)))
      .returning({ id: organizationPositions.id });
    if (!changed) return { success: false };
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain, tableName: 'organization_positions', recordId: id,
      actionType: 'DELETE', realUserId: actorUserId, newState: { reason: reason ?? null },
    });
    await emitOutboxEvent(tx, 'entity.soft_deleted', {
      entityType: 'organization_positions', entityId: id, tenantId: subdomain,
      deletedAt: now.toISOString(), deletedBy: actorUserId ?? 'system',
      deletionReason: reason, version: now.getTime(),
    });
    return { success: true };
  });
}

export async function restoreOrganizationLocation(
  tenant: string, id: string, actorUserId: string,
) {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const [current] = await tx.select({ parentLocationId: organizationLocations.parentLocationId })
      .from(organizationLocations)
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain),
        eq(organizationLocations.id, id), isNotNull(organizationLocations.deletedAt)));
    if (!current) return null;
    if (current.parentLocationId && !(await findOrganizationLocationById(subdomain, current.parentLocationId))) {
      throw new Error('Restore the parent location first');
    }
    const now = new Date();
    await tx.update(organizationLocations).set(RESTORE_PATCH(now, actorUserId))
      .where(and(eq(organizationLocations.workspaceSubdomain, subdomain),
        eq(organizationLocations.id, id), isNotNull(organizationLocations.deletedAt)));
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain, tableName: 'organization_locations', recordId: id,
      actionType: 'RESTORE', realUserId: actorUserId,
    });
    await emitOutboxEvent(tx, 'entity.restored', {
      entityType: 'organization_locations', entityId: id, tenantId: subdomain,
      restoredAt: now.toISOString(), restoredBy: actorUserId, version: now.getTime(),
    });
    return findOrganizationLocationById(subdomain, id);
  });
}

export async function restoreOrganizationPosition(
  tenant: string, id: string, actorUserId: string,
) {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const [current] = await tx.select({ parentPositionId: organizationPositions.parentPositionId })
      .from(organizationPositions)
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain),
        eq(organizationPositions.id, id), isNotNull(organizationPositions.deletedAt)));
    if (!current) return null;
    if (current.parentPositionId && !(await findOrganizationPositionById(subdomain, current.parentPositionId))) {
      throw new Error('Restore the parent position first');
    }
    const now = new Date();
    await tx.update(organizationPositions).set(RESTORE_PATCH(now, actorUserId))
      .where(and(eq(organizationPositions.workspaceSubdomain, subdomain),
        eq(organizationPositions.id, id), isNotNull(organizationPositions.deletedAt)));
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain, tableName: 'organization_positions', recordId: id,
      actionType: 'RESTORE', realUserId: actorUserId,
    });
    await emitOutboxEvent(tx, 'entity.restored', {
      entityType: 'organization_positions', entityId: id, tenantId: subdomain,
      restoredAt: now.toISOString(), restoredBy: actorUserId, version: now.getTime(),
    });
    return findOrganizationPositionById(subdomain, id);
  });
}
