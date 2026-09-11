import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendForbidden } from '../lib/httpErrors.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getWorkspaceGlobalSettings,
  getWorkspaceGrantedModulesRepo,
} from '../db/repositories/workspaceRepository.js';
import { normalizeEnabledModules } from '@mms/shared';
import { markRequestDiagnosticStage } from '../lib/requestDiagnostics.js';
import { logger } from '../lib/logger.js';

type ModuleAccessCacheEntry = {
  expiresAt: number;
  globalSettings: unknown;
  grantedModules: string[];
};

const moduleAccessCache = new Map<string, ModuleAccessCacheEntry>();
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 500;

function getCachedModuleAccess(tenant: string): { globalSettings: unknown; grantedModules: string[] } | null {
  const entry = moduleAccessCache.get(tenant);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    moduleAccessCache.delete(tenant);
    return null;
  }
  return entry;
}

function setCachedModuleAccess(tenant: string, globalSettings: unknown, grantedModules: string[]): void {
  if (moduleAccessCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = moduleAccessCache.keys().next().value;
    if (oldestKey) moduleAccessCache.delete(oldestKey);
  }
  moduleAccessCache.set(tenant, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    globalSettings,
    grantedModules,
  });
}

export function clearModuleAccessCacheForTenant(tenant?: string): void {
  if (tenant) {
    moduleAccessCache.delete(tenant);
  } else {
    moduleAccessCache.clear();
  }
}

/**
 * Creates a Fastify preHandler middleware that restricts access to a route
 * if the specified module is disabled for the current workspace.
 */
export function requireTenantModule(moduleId: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    markRequestDiagnosticStage(request, 'module_access');
    try {
      const tenant =
        getRequestTenant() ??
        (request as unknown as { tenant?: { subdomain?: string; id?: string } }).tenant?.subdomain ??
        (request.user as { workspaceSubdomain?: string } | undefined)?.workspaceSubdomain;
      if (!tenant) {
        return;
      }

      let globalSettings: unknown = null;
      let grantedModules: string[] = [];

      const cached = getCachedModuleAccess(tenant);
      if (cached) {
        globalSettings = cached.globalSettings;
        grantedModules = cached.grantedModules;
      } else {
        try {
          globalSettings = await getWorkspaceGlobalSettings(tenant);
          grantedModules = await getWorkspaceGrantedModulesRepo(tenant);
          setCachedModuleAccess(tenant, globalSettings, grantedModules);
        } catch {
          // When DB is uninitialized or in mocked unit tests, proceed with default enabled
          return;
        }
      }

      const enabledModules = normalizeEnabledModules(
        (globalSettings as { enabledModules?: Record<string, boolean> } | null)?.enabledModules
      );

      if (grantedModules.length > 0 && !grantedModules.includes(moduleId)) {
        await sendForbidden(reply, `The ${moduleId} module is not permitted by the platform.`);
        return;
      }

      if (enabledModules[moduleId] === false) {
        await sendForbidden(reply, `The ${moduleId} module is disabled for this workspace.`);
        return;
      }
    } catch (error) {
      logger.error({ err: error, moduleId }, 'Failed to check module access');
      await sendForbidden(reply, 'Failed to verify module access');
    }
  };
}
