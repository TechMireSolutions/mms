import { sql } from 'drizzle-orm';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  type User,
  FACULTY_MODULE_MANIFEST,
  isQueryFlagTrue,
  roleHasPermission,
  type facultyContract,
} from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { withTenantRead } from '../../../db/tenant-context.js';
import {
  findFacultyDepartmentById,
  listFacultyDepartments,
  saveFacultyDepartment,
  softDeleteFacultyDepartment,
  findDepartmentAncestorChain,
} from '../../../db/repositories/facultyDepartmentRepository.js';
import { restoreFacultyDepartment } from '../../../db/repositories/facultyCatalogTrashRepository.js';

export async function handleListDepartments({
  query,
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
  const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
  if (includeDeleted && !canDeleteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const departments = await listFacultyDepartments(String(tenantId), { includeDeleted });
    return { status: 200 as const, body: { departments } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to list faculty departments' } };
  }
}

export async function handleRestoreDepartment({
  params: { id },
  request,
}: ContractRouteArgs<typeof facultyContract['restoreDepartment']>): Promise<ContractRouteResponse<typeof facultyContract['restoreDepartment']>> {
  const user = request.user as User;
  if (!canDeleteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const department = await restoreFacultyDepartment(String(tenantId), id, user.id);
    if (!department) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Department not found in trash' } };
    }
    return { status: 200 as const, body: { department } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not restore department';
    if (message.includes('unique') || message.includes('duplicate')) {
      return { status: 409 as const, body: { type: 'conflict', message } };
    }
    return { status: 400 as const, body: { type: 'validation_error', message } };
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
      if (ancestors.some((a) => a.id === id || a.isCycle || (a.depth === 20 && a.parentId !== null))) {
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
      const rows = await tx.execute<{ count: number }>(sql`
        SELECT count(*)::int AS count
        FROM faculty_assignments a
        JOIN faculty f
          ON f.workspace_subdomain = a.workspace_subdomain
          AND f.id = a.faculty_id
          AND f.deleted_at IS NULL
        WHERE a.workspace_subdomain = ${String(tenantId)}
          AND a.department_id = ${id}
          AND a.deleted_at IS NULL
      `);
      return Number(rows.rows[0]?.count ?? 0) > 0;
    });

    if (inUse) {
      return { status: 409 as const, body: { type: 'conflict', message: 'Cannot delete department: active assignments exist' } };
    }

    await softDeleteFacultyDepartment(String(tenantId), id, user.id, 'User deleted');

    return { status: 200 as const, body: { success: true as const } };
  } catch (error) {
    return {
      status: 500 as const,
      body: { type: 'server_error', message: error instanceof Error ? error.message : 'Failed to delete department' },
    };
  }
}
