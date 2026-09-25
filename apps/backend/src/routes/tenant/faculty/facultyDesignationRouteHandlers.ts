import { canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  type User,
  FACULTY_MODULE_MANIFEST,
  roleHasPermission,
  type facultyContract,
} from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  listFacultyDesignationAssignments,
  listFacultyDesignations,
  saveFacultyDesignation,
  saveFacultyDesignationAssignment,
  deleteFacultyDesignationAssignment,
} from '../../../db/repositories/facultyDesignationRepository.js';
import { auditFaculty } from './facultyRouteHelpers.js';

export async function handleListDesignations({
  request,
}: ContractRouteArgs<typeof facultyContract['listDesignations']>): Promise<ContractRouteResponse<typeof facultyContract['listDesignations']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const designations = await listFacultyDesignations(String(tenantId));
    return { status: 200 as const, body: { designations } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to list Faculty designations' } };
  }
}

export async function handleSaveDesignation({
  params: { id },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['saveDesignation']>): Promise<ContractRouteResponse<typeof facultyContract['saveDesignation']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const designation = await withTenant(
      String(tenantId),
      () => saveFacultyDesignation(String(tenantId), { ...body, id }),
      { readOnly: false },
    );
    await auditFaculty(
      user,
      'faculty.designation.save',
      `Saved faculty designation ${designation.name} (${designation.code})`,
      designation.id,
    );
    return { status: 200 as const, body: { designation } };
  } catch (error) {
    return {
      status: 400 as const,
      body: { type: 'validation_error', message: error instanceof Error ? error.message : 'Invalid designation' },
    };
  }
}

export async function handleListDesignationHistory({
  params: { facultyId },
  request,
}: ContractRouteArgs<typeof facultyContract['listDesignationHistory']>): Promise<ContractRouteResponse<typeof facultyContract['listDesignationHistory']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const assignments = await listFacultyDesignationAssignments(String(tenantId), facultyId);
    return { status: 200 as const, body: { assignments } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to load designation history' } };
  }
}

export async function handleSaveDesignationAssignment({
  params: { facultyId, assignmentId },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['saveDesignationAssignment']>): Promise<ContractRouteResponse<typeof facultyContract['saveDesignationAssignment']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const assignment = await withTenant(
      String(tenantId),
      () => saveFacultyDesignationAssignment(
        String(tenantId),
        { ...body, id: assignmentId, facultyId },
      ),
      { readOnly: false },
    );
    await auditFaculty(
      user,
      'faculty.designation_assignment.save',
      `Assigned designation ${assignment.designationName} to faculty member ${facultyId}`,
      assignment.id,
    );
    return { status: 200 as const, body: { assignment } };
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23P01' || (error as { code?: string }).code === '23505') {
      return { status: 409 as const, body: { type: 'conflict', message: 'Designation period overlaps an existing assignment' } };
    }
    return {
      status: 400 as const,
      body: { type: 'validation_error', message: error instanceof Error ? error.message : 'Invalid designation assignment' },
    };
  }
}

export async function handleDeleteDesignationAssignment({
  params: { facultyId, assignmentId },
  request,
}: ContractRouteArgs<typeof facultyContract['deleteDesignationAssignment']>): Promise<ContractRouteResponse<typeof facultyContract['deleteDesignationAssignment']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    await deleteFacultyDesignationAssignment(String(tenantId), facultyId, assignmentId);
    await auditFaculty(
      user,
      'faculty.designation_assignment.delete',
      `Deleted designation assignment ${assignmentId} for faculty member ${facultyId}`,
      assignmentId,
    );
    return { status: 200 as const, body: { success: true as const } };
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Designation assignment not found' } };
    }
    if (statusCode === 409) {
      return {
        status: 409 as const,
        body: { type: 'conflict', message: error instanceof Error ? error.message : 'Cannot delete this assignment' },
      };
    }
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to delete designation assignment' } };
  }
}
