import type { User, facultyContract } from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { canWriteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { transitionDesignation } from '../../../faculty/use-cases/facultyDesignationTransitionUseCase.js';
import { HttpDomainError } from '../../../lib/httpErrors.js';
import { isUniqueViolation } from '../../../lib/pgErrors.js';
import { auditFaculty } from './facultyRouteHelpers.js';
import { broadcastCollection } from '../../../lib/livePush.js';

export async function handleTransitionDesignation({ params: { facultyId }, body, request }:
  ContractRouteArgs<typeof facultyContract['transitionDesignation']>,
): Promise<ContractRouteResponse<typeof facultyContract['transitionDesignation']>> {
  const user = request.user as User;
  const tenant = request.tenant?.id;
  if (!tenant || !canWriteCollection(user, 'faculty')) {
    return { status: 403, body: { type: 'forbidden', message: 'Insufficient permissions' } };
  }
  try {
    const assignment = await withTenant(tenant, async () => {
      const saved = await transitionDesignation(tenant, facultyId, body);
      await auditFaculty(user, 'faculty.designation_assignment.save', `Transitioned designation for faculty member ${facultyId}`, saved.id);
      return saved;
    });
    await broadcastCollection('faculty');
    return { status: 200, body: { assignment } };
  } catch (error) {
    if (error instanceof HttpDomainError && (error.statusCode === 404 || error.statusCode === 409)) {
      return { status: error.statusCode, body: { type: error.type, message: error.message } };
    }
    if (isUniqueViolation(error) || isOverlap(error)) {
      return { status: 409, body: { type: 'conflict', message: 'Designation period overlaps an existing assignment' } };
    }
    request.log.error({ err: error }, 'Failed to transition faculty designation');
    return { status: 400, body: { type: 'validation_error', message: 'Unable to transition designation; verify its status and dates' } };
  }
}

function isOverlap(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return ('code' in error && error.code === '23P01') || ('cause' in error && isOverlap(error.cause));
}
