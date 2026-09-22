import { withTenant } from '../../../db/tenant-context.js';
import { canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import type { User, facultyContract } from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import {
  listFacultyDesignationAssignments,
  listFacultyDesignations,
  saveFacultyDesignation,
  saveFacultyDesignationAssignment,
} from '../../../db/repositories/facultyDesignationRepository.js';

export async function handleListDesignations({
  request,
}: ContractRouteArgs<typeof facultyContract['listDesignations']>): Promise<ContractRouteResponse<typeof facultyContract['listDesignations']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const designations = await withTenant(
      String(request.tenant?.id),
      () => listFacultyDesignations(String(request.tenant?.id)),
      { readOnly: true },
    );
    return { status: 200 as const, body: { designations } };
  } catch {
    return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list Faculty designations' } };
  }
}

export async function handleSaveDesignation({
  params: { id },
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['saveDesignation']>): Promise<ContractRouteResponse<typeof facultyContract['saveDesignation']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const designation = await withTenant(
      String(request.tenant?.id),
      () => saveFacultyDesignation(String(request.tenant?.id), { ...body, id }),
      { readOnly: false },
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
  try {
    const assignments = await withTenant(
      String(request.tenant?.id),
      () => listFacultyDesignationAssignments(String(request.tenant?.id), facultyId),
      { readOnly: true },
    );
    return { status: 200 as const, body: { assignments } };
  } catch {
    return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load designation history' } };
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
  try {
    const assignment = await withTenant(
      String(request.tenant?.id),
      () => saveFacultyDesignationAssignment(String(request.tenant?.id), { ...body, id: assignmentId, facultyId }),
      { readOnly: false },
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
