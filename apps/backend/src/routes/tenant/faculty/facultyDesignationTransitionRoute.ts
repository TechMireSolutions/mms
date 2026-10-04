import type { facultyContract } from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';

/** Deprecated FDA transition — appointments SSOT is faculty_assignments. */
export async function handleTransitionDesignation(
  _args: ContractRouteArgs<typeof facultyContract['transitionDesignation']>,
): Promise<ContractRouteResponse<typeof facultyContract['transitionDesignation']>> {
  return {
    status: 410 as const,
    body: {
      type: 'gone',
      message: 'Designation transitions are retired. Use faculty appointments (/assignments) instead.',
    },
  };
}
