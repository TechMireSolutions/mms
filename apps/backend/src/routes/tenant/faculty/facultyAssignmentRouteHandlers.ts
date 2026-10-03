import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  type User,
  type FacultyAssignmentEntity,
  type facultyContract,
  isQueryFlagTrue,
} from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import type { FacultyAssignmentRow } from '../../../db/schema/facultyAssignmentTables.js';
import {
  findFacultyAssignmentById,
  listFacultyAssignments,
  saveFacultyAssignment,
  closeAssignment,
  softDeleteFacultyAssignment,
} from '../../../db/repositories/facultyAssignmentRepository.js';
import { checkAssignmentCycleSafe } from '../../../db/repositories/facultyAssignmentHierarchyRepository.js';

export {
  handleGetSubordinates,
  handleGetManagers,
} from './facultyAssignmentHierarchyRouteHandlers.js';

function toIso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  return typeof d === 'string' ? d : d.toISOString();
}

function toFacultyAssignmentEntity(row: FacultyAssignmentRow): FacultyAssignmentEntity {
  return {
    id: row.id,
    facultyId: row.facultyId,
    departmentId: row.departmentId,
    designationId: row.designationId,
    positionId: row.positionId,
    reportsToAssignmentId: row.reportsToAssignmentId ?? null,
    isPrimary: Boolean(row.isPrimary),
    startDate: row.startDate,
    endDate: row.endDate ?? null,
    notes: row.notes ?? null,
    deletedAt: row.deletedAt ? toIso(row.deletedAt) ?? null : null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function handleListAssignments({
  params: { facultyId },
  query,
  request,
}: ContractRouteArgs<typeof facultyContract['listAssignments']>): Promise<ContractRouteResponse<typeof facultyContract['listAssignments']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const activeOnly = query?.activeOnly === undefined ? true : isQueryFlagTrue(query.activeOnly);
    if (!activeOnly && !canDeleteCollection(user, 'faculty')) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Trash access requires delete permission' } };
    }
    const rows = await listFacultyAssignments(String(tenantId), facultyId, { activeOnly });
    return { status: 200 as const, body: { assignments: rows.map(toFacultyAssignmentEntity) } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to list faculty assignments' } };
  }
}

export async function handleSaveAssignment({
  params: { facultyId, id },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['saveAssignment']>): Promise<ContractRouteResponse<typeof facultyContract['saveAssignment']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const existing = await findFacultyAssignmentById(String(tenantId), id);
    // Compatibility-only: ignore reportsToAssignmentId on create; validate only on update when present.
    const reportsToAssignmentId = existing
      ? (body.reportsToAssignmentId !== undefined
        ? body.reportsToAssignmentId
        : existing.reportsToAssignmentId ?? null)
      : null;
    if (reportsToAssignmentId) {
      if (reportsToAssignmentId === id) {
        return { status: 400 as const, body: { type: 'validation_error', message: 'Assignment cannot report to itself' } };
      }
      const isSafe = await checkAssignmentCycleSafe(String(tenantId), id, reportsToAssignmentId);
      if (!isSafe) {
        return { status: 400 as const, body: { type: 'validation_error', message: 'Circular reporting hierarchy detected' } };
      }
    }

    await saveFacultyAssignment(String(tenantId), {
      ...body,
      reportsToAssignmentId,
      id,
      facultyId,
      workspaceSubdomain: String(tenantId),
      updatedBy: user.id,
    });
    const saved = await findFacultyAssignmentById(String(tenantId), id);
    if (!saved) {
      return { status: 500 as const, body: { type: 'server_error', message: 'Failed to retrieve saved assignment' } };
    }
    return { status: 200 as const, body: { assignment: toFacultyAssignmentEntity(saved) } };
  } catch (error) {
    return {
      status: 400 as const,
      body: { type: 'validation_error', message: error instanceof Error ? error.message : 'Invalid assignment' },
    };
  }
}

export async function handleCloseAssignment({
  params: { facultyId, id },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['closeAssignment']>): Promise<ContractRouteResponse<typeof facultyContract['closeAssignment']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const existing = await findFacultyAssignmentById(String(tenantId), id);
    if (!existing || existing.facultyId !== facultyId) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Assignment not found' } };
    }
    if (existing.startDate > body.endDate) {
      return { status: 400 as const, body: { type: 'validation_error', message: 'End date must not precede start date' } };
    }
    await closeAssignment(String(tenantId), id, body.endDate, user.id);
    return { status: 200 as const, body: { success: true as const } };
  } catch (error) {
    return {
      status: 400 as const,
      body: { type: 'validation_error', message: error instanceof Error ? error.message : 'Failed to close assignment' },
    };
  }
}

export async function handleDeleteAssignment({
  params: { facultyId, id },
  request,
}: ContractRouteArgs<typeof facultyContract['deleteAssignment']>): Promise<ContractRouteResponse<typeof facultyContract['deleteAssignment']>> {
  const user = request.user as User;
  if (!canDeleteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const existing = await findFacultyAssignmentById(String(tenantId), id);
    if (!existing || existing.facultyId !== facultyId) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Assignment not found' } };
    }
    await softDeleteFacultyAssignment(String(tenantId), id, user.id, 'User deleted');
    return { status: 200 as const, body: { success: true as const } };
  } catch (error) {
    return {
      status: 500 as const,
      body: { type: 'server_error', message: error instanceof Error ? error.message : 'Failed to delete assignment' },
    };
  }
}
