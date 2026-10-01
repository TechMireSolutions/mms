import { and, eq, isNull, sql } from 'drizzle-orm';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  type User,
  FACULTY_MODULE_MANIFEST,
  roleHasPermission,
  type facultyContract,
} from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { withTenantRead } from '../../../db/tenant-context.js';
import { facultyAssignments } from '../../../db/schema/facultyAssignmentTables.js';
import {
  findFacultyDepartmentById,
  listFacultyDepartments,
  saveFacultyDepartment,
  softDeleteFacultyDepartment,
  findDepartmentAncestorChain,
} from '../../../db/repositories/facultyDepartmentRepository.js';
import { auditFaculty } from './facultyRouteHelpers.js';

export async function handleListDepartments({
  request,
}: ContractRouteArgs<typeof facultyContract['listDepartments']>): Promise<ContractRouteResponse<typeof facultyContract['listDepartments']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const departments = await listFacultyDepartments(String(tenantId));
    return { status: 200 as const, body: { departments } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to list faculty departments' } };
  }
}

export async function handleSaveDepartment({
  params: { id },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['saveDepartment']>): Promise<ContractRouteResponse<typeof facultyContract['saveDepartment']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    if (body.parentId) {
      if (body.parentId === id) {
        return { status: 400 as const, body: { type: 'validation_error', message: 'Department cannot be its own parent' } };
      }
      const ancestors = await findDepartmentAncestorChain(String(tenantId), body.parentId);
      if (ancestors.some((a) => a.id === id)) {
        return { status: 400 as const, body: { type: 'validation_error', message: 'Circular parent relationship detected' } };
      }
    }

    await saveFacultyDepartment(String(tenantId), {
      ...body,
      id,
      workspaceSubdomain: String(tenantId),
      updatedBy: user.id,
    });
    const department = await findFacultyDepartmentById(String(tenantId), id);
    if (!department) {
      return { status: 500 as const, body: { type: 'server_error', message: 'Failed to retrieve saved department' } };
    }
    await auditFaculty(
      user,
      'faculty.department.save',
      `Saved faculty department ${department.name} (${department.code})`,
      department.id,
    );
    return { status: 200 as const, body: { department } };
  } catch (error) {
    return {
      status: 400 as const,
      body: { type: 'validation_error', message: error instanceof Error ? error.message : 'Invalid department' },
    };
  }
}

export async function handleDeleteDepartment({
  params: { id },
  request,
}: ContractRouteArgs<typeof facultyContract['deleteDepartment']>): Promise<ContractRouteResponse<typeof facultyContract['deleteDepartment']>> {
  const user = request.user as User;
  if (!canDeleteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const existing = await findFacultyDepartmentById(String(tenantId), id);
    if (!existing) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Department not found' } };
    }

    const inUse = await withTenantRead(String(tenantId), async (tx) => {
      const rows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(facultyAssignments)
        .where(
          and(
            eq(facultyAssignments.workspaceSubdomain, String(tenantId)),
            eq(facultyAssignments.departmentId, id),
            isNull(facultyAssignments.deletedAt),
          ),
        );
      return (rows[0]?.count ?? 0) > 0;
    });

    if (inUse) {
      return { status: 409 as const, body: { type: 'conflict', message: 'Cannot delete department: active assignments exist' } };
    }

    await softDeleteFacultyDepartment(String(tenantId), id, user.id, 'User deleted');
    await auditFaculty(
      user,
      'faculty.department.delete',
      `Deleted faculty department ${existing.name} (${existing.code})`,
      id,
    );
    return { status: 200 as const, body: { success: true as const } };
  } catch (error) {
    return {
      status: 500 as const,
      body: { type: 'server_error', message: error instanceof Error ? error.message : 'Failed to delete department' },
    };
  }
}
