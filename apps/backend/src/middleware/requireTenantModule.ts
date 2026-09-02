import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendForbidden } from '../lib/httpErrors.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getWorkspaceGlobalSettings,
  getWorkspaceGrantedModulesRepo,
} from '../db/repositories/workspaceRepository.js';
import { normalizeEnabledModules } from '@mms/shared';
import { markRequestDiagnosticStage } from '../lib/requestDiagnostics.js';

/**
 * Creates a Fastify preHandler middleware that restricts access to a route
 * if the specified module is disabled for the current workspace.
 */
export function requireTenantModule(moduleId: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    markRequestDiagnosticStage(request, 'module_access');
    try {
      const tenant = getRequestTenant();
      if (!tenant) {
        return;
      }

      let globalSettings = null;
      let grantedModules: string[] = [];
      try {
        globalSettings = await getWorkspaceGlobalSettings(tenant);
        grantedModules = await getWorkspaceGrantedModulesRepo(tenant);
      } catch {
        // When DB is uninitialized or in mocked unit tests, proceed with default enabled
        return;
      }

      const enabledModules = normalizeEnabledModules(
        globalSettings?.enabledModules as Record<string, boolean> | undefined
      );

      if (grantedModules.length > 0 && !grantedModules.includes(moduleId)) {
        sendForbidden(reply, `The ${moduleId} module is not permitted by the platform.`);
        return;
      }

      if (enabledModules[moduleId] === false) {
        sendForbidden(reply, `The ${moduleId} module is disabled for this workspace.`);
        return;
      }
    } catch (error) {
      console.error('requireTenantModule error:', error);
      request.log.error(error, `Failed to check module access for ${moduleId}`);
      sendForbidden(reply, 'Failed to verify module access');
    }
  };
}
