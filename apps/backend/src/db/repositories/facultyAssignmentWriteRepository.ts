import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { facultyAssignments } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import type { InsertFacultyAssignmentRow } from '../schema/facultyAssignmentTables.js';
import { validateFacultyAssignment, lockFacultyHierarchy } from './facultyAssignmentValidation.js';
import { findFacultyAssignmentById } from './facultyAssignmentRepository.js';
import { recordModernAuditEvent } from '../../services/auditTrailService.js';

/* ── Write helpers ────────────────────────────────────────────────────────── */

export async function saveFacultyAssignment(
  tenant: string,
  assignment: InsertFacultyAssignmentRow,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const current = await findFacultyAssignmentById(subdomain, assignment.id);
    assignment = { ...assignment, positionId: assignment.positionId === undefined
      ? current?.positionId ?? null : assignment.positionId };
    await validateFacultyAssignment(tx, subdomain, assignment);
    await tx
      .insert(facultyAssignments)
      .values({ ...assignment, workspaceSubdomain: subdomain })
      .onConflictDoUpdate({
        target: [facultyAssignments.workspaceSubdomain, facultyAssignments.id],
        set: {
          departmentId: assignment.departmentId,
          designationId: assignment.designationId,
          ...(assignment.positionId !== undefined ? { positionId: assignment.positionId } : {}),
          reportsToAssignmentId: assignment.reportsToAssignmentId ?? null,
          isPrimary: assignment.isPrimary,
          startDate: assignment.startDate,
          endDate: assignment.endDate ?? null,
          notes: assignment.notes ?? null,
          updatedAt: new Date(),
          updatedBy: assignment.updatedBy ?? null,
        },
      });
    await recordModernAuditEvent(tx, { workspaceSubdomain: subdomain, tableName: 'faculty_assignments',
      recordId: assignment.id, actionType: 'UPDATE', realUserId: assignment.updatedBy, newState: assignment });
  });
}

export async function closeAssignment(
  tenant: string,
  id: string,
  endDate: string,
  updatedBy?: string,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const current = await findFacultyAssignmentById(subdomain, id);
    if (!current) throw new Error('Assignment not found');
    await validateFacultyAssignment(tx, subdomain, { ...current, endDate });
    await tx
      .update(facultyAssignments)
      .set({ endDate, updatedAt: new Date(), updatedBy: updatedBy ?? null })
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.id, id),
          isNull(facultyAssignments.deletedAt),
        ),
      );
    await recordModernAuditEvent(tx, { workspaceSubdomain: subdomain, tableName: 'faculty_assignments',
      recordId: id, actionType: 'UPDATE', realUserId: updatedBy, newState: { endDate } });
  });
}

export async function softDeleteFacultyAssignment(
  tenant: string,
  id: string,
  deletedBy: string,
  reason?: string,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await lockFacultyHierarchy(tx, subdomain);
    const dependents = await tx.execute(sql`SELECT id FROM faculty_assignments
      WHERE workspace_subdomain = ${subdomain} AND reports_to_assignment_id = ${id}
        AND deleted_at IS NULL LIMIT 1`);
    if (dependents.rows.length) throw new Error('Assignment has active reporting dependents');
    const deletedAt = new Date();
    const changed = await tx
      .update(facultyAssignments)
      .set({ deletedAt, deletedBy, deletionReason: reason ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.id, id),
          isNull(facultyAssignments.deletedAt),
        ),
      ).returning({ id: facultyAssignments.id });
    if (!changed.length) return;
    await recordModernAuditEvent(tx, { workspaceSubdomain: subdomain, tableName: 'faculty_assignments',
      recordId: id, actionType: 'DELETE', realUserId: deletedBy, newState: { reason } });
    await emitOutboxEvent(tx, 'entity.soft_deleted', { entityType: 'faculty_assignments', entityId: id,
      tenantId: subdomain, deletedAt: deletedAt.toISOString(), deletedBy, deletionReason: reason, version: deletedAt.getTime() });
  });
}
