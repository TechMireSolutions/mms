import { and, eq, isNotNull } from 'drizzle-orm';
import { recordModernAuditEvent } from '../../services/auditTrailService.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { facultyDepartments, facultyDesignations } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { findFacultyDepartmentById } from './facultyDepartmentRepository.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';

const RESTORE_PATCH = (now: Date, actorUserId: string) => ({
  deletedAt: null,
  deletedBy: null,
  deletionReason: null,
  restoredAt: now,
  restoredBy: actorUserId,
  deletedWithCascade: false,
  isActive: true,
  updatedAt: now,
});

/** Restores a soft-deleted faculty department (parent must be active when set). */
export async function restoreFacultyDepartment(
  tenant: string,
  id: string,
  actorUserId: string,
) {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const [current] = await tx
      .select({ parentId: facultyDepartments.parentId })
      .from(facultyDepartments)
      .where(
        and(
          eq(facultyDepartments.workspaceSubdomain, subdomain),
          eq(facultyDepartments.id, id),
          isNotNull(facultyDepartments.deletedAt),
        ),
      );
    if (!current) return null;
    if (current.parentId) {
      const parent = await findFacultyDepartmentById(subdomain, current.parentId);
      if (!parent) throw new Error('Restore the parent department first');
    }
    const now = new Date();
    const [restored] = await tx
      .update(facultyDepartments)
      .set(RESTORE_PATCH(now, actorUserId))
      .where(
        and(
          eq(facultyDepartments.workspaceSubdomain, subdomain),
          eq(facultyDepartments.id, id),
          isNotNull(facultyDepartments.deletedAt),
        ),
      )
      .returning();
    if (!restored) return null;
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain,
      tableName: 'faculty_departments',
      recordId: id,
      actionType: 'RESTORE',
      realUserId: actorUserId,
    });
    await emitOutboxEvent(tx, 'entity.restored', {
      entityType: 'faculty_departments',
      entityId: id,
      tenantId: subdomain,
      restoredAt: now.toISOString(),
      restoredBy: actorUserId,
      version: now.getTime(),
    });
    return restored;
  });
}

/** Restores a soft-deleted faculty designation definition. */
export async function restoreFacultyDesignation(
  tenant: string,
  id: string,
  actorUserId: string,
) {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const [current] = await tx
      .select({ id: facultyDesignations.id })
      .from(facultyDesignations)
      .where(
        and(
          eq(facultyDesignations.workspaceSubdomain, subdomain),
          eq(facultyDesignations.id, id),
          isNotNull(facultyDesignations.deletedAt),
        ),
      );
    if (!current) return null;
    const now = new Date();
    const [restored] = await tx
      .update(facultyDesignations)
      .set(RESTORE_PATCH(now, actorUserId))
      .where(
        and(
          eq(facultyDesignations.workspaceSubdomain, subdomain),
          eq(facultyDesignations.id, id),
          isNotNull(facultyDesignations.deletedAt),
        ),
      )
      .returning({
        id: facultyDesignations.id,
        code: facultyDesignations.code,
        name: facultyDesignations.name,
        hierarchyRank: facultyDesignations.hierarchyRank,
        isActive: facultyDesignations.isActive,
        createdAt: facultyDesignations.createdAt,
        updatedAt: facultyDesignations.updatedAt,
      });
    if (!restored) return null;
    await recordModernAuditEvent(tx, {
      workspaceSubdomain: subdomain,
      tableName: 'faculty_designations',
      recordId: id,
      actionType: 'RESTORE',
      realUserId: actorUserId,
    });
    await emitOutboxEvent(tx, 'entity.restored', {
      entityType: 'faculty_designations',
      entityId: id,
      tenantId: subdomain,
      restoredAt: now.toISOString(),
      restoredBy: actorUserId,
      version: now.getTime(),
    });
    return {
      ...restored,
      assignableRoles: [] as string[],
      deletedAt: null,
      createdAt: restored.createdAt.toISOString(),
      updatedAt: restored.updatedAt.toISOString(),
    };
  });
}
