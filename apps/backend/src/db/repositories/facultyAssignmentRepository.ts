import { and, eq, isNull } from 'drizzle-orm';
import { facultyAssignments } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import type {
  FacultyAssignmentRow,
  InsertFacultyAssignmentRow,
} from '../schema/facultyAssignmentTables.js';

export {
  type AssignmentTreeNode,
  findAssignmentManagerChain,
  findAssignmentSubordinateTree,
  checkAssignmentCycleSafe,
} from './facultyAssignmentHierarchyRepository.js';

const FACULTY_ASSIGNMENT_COLUMNS = {
  id: facultyAssignments.id,
  workspaceSubdomain: facultyAssignments.workspaceSubdomain,
  facultyId: facultyAssignments.facultyId,
  departmentId: facultyAssignments.departmentId,
  designationId: facultyAssignments.designationId,
  reportsToAssignmentId: facultyAssignments.reportsToAssignmentId,
  isPrimary: facultyAssignments.isPrimary,
  startDate: facultyAssignments.startDate,
  endDate: facultyAssignments.endDate,
  notes: facultyAssignments.notes,
  deletedAt: facultyAssignments.deletedAt,
  deletedBy: facultyAssignments.deletedBy,
  deletionReason: facultyAssignments.deletionReason,
  restoredAt: facultyAssignments.restoredAt,
  restoredBy: facultyAssignments.restoredBy,
  deletedWithCascade: facultyAssignments.deletedWithCascade,
  createdAt: facultyAssignments.createdAt,
  updatedAt: facultyAssignments.updatedAt,
  createdBy: facultyAssignments.createdBy,
  updatedBy: facultyAssignments.updatedBy,
};

/* ── Read helpers ─────────────────────────────────────────────────────────── */

export async function findFacultyAssignmentById(
  tenant: string,
  id: string,
): Promise<FacultyAssignmentRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_ASSIGNMENT_COLUMNS)
      .from(facultyAssignments)
      .where(and(eq(facultyAssignments.workspaceSubdomain, subdomain), eq(facultyAssignments.id, id)))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function listFacultyAssignments(
  tenant: string,
  facultyId: string,
  options: { activeOnly?: boolean } = { activeOnly: true },
): Promise<FacultyAssignmentRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const where = options.activeOnly
      ? and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.facultyId, facultyId),
          isNull(facultyAssignments.deletedAt),
        )
      : and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.facultyId, facultyId),
        );
    return tx
      .select(FACULTY_ASSIGNMENT_COLUMNS)
      .from(facultyAssignments)
      .where(where)
      .orderBy(facultyAssignments.startDate);
  });
}

export async function findPrimaryFacultyAssignment(
  tenant: string,
  facultyId: string,
): Promise<FacultyAssignmentRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_ASSIGNMENT_COLUMNS)
      .from(facultyAssignments)
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.facultyId, facultyId),
          eq(facultyAssignments.isPrimary, true),
          isNull(facultyAssignments.deletedAt),
          isNull(facultyAssignments.endDate),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  });
}

/* ── Write helpers ────────────────────────────────────────────────────────── */

export async function saveFacultyAssignment(
  tenant: string,
  assignment: InsertFacultyAssignmentRow,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(facultyAssignments)
      .values({ ...assignment, workspaceSubdomain: subdomain })
      .onConflictDoUpdate({
        target: [facultyAssignments.workspaceSubdomain, facultyAssignments.id],
        set: {
          departmentId: assignment.departmentId,
          designationId: assignment.designationId,
          reportsToAssignmentId: assignment.reportsToAssignmentId ?? null,
          isPrimary: assignment.isPrimary,
          startDate: assignment.startDate,
          endDate: assignment.endDate ?? null,
          notes: assignment.notes ?? null,
          updatedAt: new Date(),
          updatedBy: assignment.updatedBy ?? null,
        },
      });
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
    await tx
      .update(facultyAssignments)
      .set({ endDate, isPrimary: false, updatedAt: new Date(), updatedBy: updatedBy ?? null })
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.id, id),
          isNull(facultyAssignments.deletedAt),
        ),
      );
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
    await tx
      .update(facultyAssignments)
      .set({ deletedAt: new Date(), deletedBy, deletionReason: reason ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(facultyAssignments.workspaceSubdomain, subdomain),
          eq(facultyAssignments.id, id),
          isNull(facultyAssignments.deletedAt),
        ),
      );
  });
}
