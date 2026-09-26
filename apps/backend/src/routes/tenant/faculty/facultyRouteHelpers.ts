import {
  type Faculty,
  type User,
  FACULTY_MODULE_MANIFEST,
  roleHasPermission,
  type facultyContract,
} from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import { facultyUseCases } from '../../../faculty/use-cases/facultyUseCases.js';
import { withTenant } from '../../../db/tenant-context.js';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';

/** Thin Faculty audit helper — same shape as Contacts `auditContact`. */
export const auditFaculty = createCollectionAuditHelper('faculty');

/** Strips faculty properties the viewer role cannot read (field-config + viewer role). */
export async function sanitizeFacultyForUser(facultyList: Faculty[], user: User): Promise<Faculty[]> {
  return facultyUseCases.sanitizeFacultyListForViewer(facultyList, user.role);
}

export async function sanitizeOneFacultyForUser(facultyMember: Faculty, user: User): Promise<Faculty> {
  return facultyUseCases.sanitizeFacultyForViewer(facultyMember, user.role);
}

export async function handleDuplicateCheck({
  body,
  request,
}: ContractRouteArgs<typeof facultyContract['duplicateCheck']>): Promise<ContractRouteResponse<typeof facultyContract['duplicateCheck']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const result = await withTenant(String(request.tenant?.id), () =>
      facultyUseCases.checkFacultyRegistrationDuplicate(body), { readOnly: true });
    return { status: 200 as const, body: result };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to check duplicate' } };
  }
}

export async function handleNextEmployeeId({
  query,
  request,
}: ContractRouteArgs<typeof facultyContract['nextEmployeeId']>): Promise<ContractRouteResponse<typeof facultyContract['nextEmployeeId']>> {
  const user = request.user as User;
  if (!canReadCollection(user, 'faculty')) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const employeeId = await withTenant(String(request.tenant?.id), () =>
      facultyUseCases.computeNextFacultyEmployeeIdForSettings({
        idPrefix: query.prefix,
        idTemplate: query.template,
        idDigits: query.digits,
        idStartSeq: query.startSeq,
        idRestartAnnually: query.restartAnnually,
      }), { readOnly: true });
    return { status: 200 as const, body: { employeeId } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to compute next employee ID' } };
  }
}

export async function handleMigrateEmployeeIds({
  request,
}: ContractRouteArgs<typeof facultyContract['migrateEmployeeIds']>): Promise<ContractRouteResponse<typeof facultyContract['migrateEmployeeIds']>> {
  const user = request.user as User;
  if (!canWriteCollection(user, 'faculty') || !roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
    return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const result = await withTenant(String(request.tenant?.id), () =>
      facultyUseCases.migrateFacultyMissingEmployeeIds(), { readOnly: false });
    return { status: 200 as const, body: { success: true as const, ...result } };
  } catch {
    return { status: 500 as const, body: { type: 'server_error', message: 'Failed to migrate employee IDs' } };
  }
}
