import { canWriteCollection, canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import {
  type User,
  FACULTY_MODULE_MANIFEST,
  isQueryFlagTrue,
  roleHasPermission,
  type facultyContract,
} from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  listFacultyDesignationAssignments,
  listFacultyDesignations,
  saveFacultyDesignation,
  softDeleteFacultyDesignation,
} from '../../../db/repositories/facultyDesignationRepository.js';
import { restoreFacultyDesignation } from '../../../db/repositories/facultyCatalogTrashRepository.js';
import { auditFaculty } from './facultyRouteHelpers.js';

export async function handleListDesignations({
  query,
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
  const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
  if (includeDeleted && !canDeleteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const designations = await listFacultyDesignations(String(tenantId), { includeDeleted });
    return { status: 200 as const, body: { designations } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to list Faculty designations' } };
  }
}

export async function handleRestoreDesignation({
  params: { id },
  request,
}: ContractRouteArgs<typeof facultyContract['restoreDesignation']>): Promise<ContractRouteResponse<typeof facultyContract['restoreDesignation']>> {
  const user = request.user as User;
  if (!canDeleteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    const designation = await restoreFacultyDesignation(String(tenantId), id, user.id);
    if (!designation) {
      return { status: 404 as const, body: { type: 'not_found', message: 'Designation not found in trash' } };
    }
    return { status: 200 as const, body: { designation } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not restore designation';
    if (message.includes('unique') || message.includes('duplicate')) {
      return { status: 409 as const, body: { type: 'conflict', message } };
    }
    return { status: 400 as const, body: { type: 'validation_error', message } };
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

const FDA_GONE = {
  type: 'gone',
  message: 'Designation-history writes are retired. Use faculty appointments (/assignments) instead.',
} as const;

export async function handleSaveDesignationAssignment(): Promise<
  ContractRouteResponse<typeof facultyContract['saveDesignationAssignment']>
> {
  return { status: 410 as const, body: FDA_GONE };
}

export async function handleDeleteDesignationAssignment(): Promise<
  ContractRouteResponse<typeof facultyContract['deleteDesignationAssignment']>
> {
  return { status: 410 as const, body: FDA_GONE };
}

export async function handleDeleteDesignation({
  params: { id },
  request,
}: ContractRouteArgs<typeof facultyContract['deleteDesignation']>): Promise<ContractRouteResponse<typeof facultyContract['deleteDesignation']>> {
  const user = request.user as User;
  if (!canDeleteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  const tenantId = request.tenant?.id;
  if (!tenantId) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Tenant context required' } };
  }
  try {
    await softDeleteFacultyDesignation(String(tenantId), id, user.id);
    await auditFaculty(
      user,
      'faculty.designation.delete',
      `Deleted faculty designation ${id}`,
      id,
    );
    return { status: 200 as const, body: { success: true as const } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete designation';
    if (message.includes('dependent')) {
      return { status: 409 as const, body: { type: 'conflict', message } };
    }
    return { status: 400 as const, body: { type: 'validation_error', message } };
  }
}
