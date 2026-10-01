import { and, eq, isNull } from 'drizzle-orm';
import { facultyDepartments } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import type { FacultyDepartmentRow, InsertFacultyDepartmentRow } from '../schema/facultyDepartmentTables.js';

export {
  type DepartmentAncestor,
  findDepartmentAncestorChain,
} from './facultyDepartmentHierarchyRepository.js';

const FACULTY_DEPARTMENT_COLUMNS = {
  id: facultyDepartments.id,
  workspaceSubdomain: facultyDepartments.workspaceSubdomain,
  parentId: facultyDepartments.parentId,
  name: facultyDepartments.name,
  code: facultyDepartments.code,
  headFacultyId: facultyDepartments.headFacultyId,
  deletedAt: facultyDepartments.deletedAt,
  deletedBy: facultyDepartments.deletedBy,
  deletionReason: facultyDepartments.deletionReason,
  restoredAt: facultyDepartments.restoredAt,
  restoredBy: facultyDepartments.restoredBy,
  deletedWithCascade: facultyDepartments.deletedWithCascade,
  createdAt: facultyDepartments.createdAt,
  updatedAt: facultyDepartments.updatedAt,
  createdBy: facultyDepartments.createdBy,
  updatedBy: facultyDepartments.updatedBy,
};

/* ── Read helpers ─────────────────────────────────────────────────────────── */

export async function findFacultyDepartmentById(
  tenant: string,
  id: string,
): Promise<FacultyDepartmentRow | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_DEPARTMENT_COLUMNS)
      .from(facultyDepartments)
      .where(and(eq(facultyDepartments.workspaceSubdomain, subdomain), eq(facultyDepartments.id, id)))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function listFacultyDepartments(
  tenant: string,
  options: { includeDeleted?: boolean } = {},
): Promise<FacultyDepartmentRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const condition = options.includeDeleted
      ? eq(facultyDepartments.workspaceSubdomain, subdomain)
      : and(eq(facultyDepartments.workspaceSubdomain, subdomain), isNull(facultyDepartments.deletedAt));
    return tx.select(FACULTY_DEPARTMENT_COLUMNS).from(facultyDepartments).where(condition).orderBy(facultyDepartments.name);
  });
}

export async function listChildDepartments(
  tenant: string,
  parentId: string | null,
): Promise<FacultyDepartmentRow[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_DEPARTMENT_COLUMNS)
      .from(facultyDepartments)
      .where(
        parentId
          ? and(
              eq(facultyDepartments.workspaceSubdomain, subdomain),
              eq(facultyDepartments.parentId, parentId),
              isNull(facultyDepartments.deletedAt),
            )
          : and(
              eq(facultyDepartments.workspaceSubdomain, subdomain),
              isNull(facultyDepartments.parentId),
              isNull(facultyDepartments.deletedAt),
            ),
      )
      .orderBy(facultyDepartments.name);
    return rows;
  });
}

/* ── Write helpers ────────────────────────────────────────────────────────── */

export async function saveFacultyDepartment(
  tenant: string,
  dept: InsertFacultyDepartmentRow,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(facultyDepartments)
      .values({ ...dept, workspaceSubdomain: subdomain })
      .onConflictDoUpdate({
        target: [facultyDepartments.workspaceSubdomain, facultyDepartments.id],
        set: {
          parentId: dept.parentId ?? null,
          name: dept.name,
          code: dept.code,
          headFacultyId: dept.headFacultyId ?? null,
          updatedAt: new Date(),
          updatedBy: dept.updatedBy ?? null,
        },
      });
  });
}

export async function softDeleteFacultyDepartment(
  tenant: string,
  id: string,
  deletedBy: string,
  reason?: string,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .update(facultyDepartments)
      .set({ deletedAt: new Date(), deletedBy, deletionReason: reason ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(facultyDepartments.workspaceSubdomain, subdomain),
          eq(facultyDepartments.id, id),
          isNull(facultyDepartments.deletedAt),
        ),
      );
  });
}
