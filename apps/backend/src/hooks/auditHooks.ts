import type { FastifyRequest, FastifyReply } from 'fastify';
import { activeDb } from '../db/dbConnection.js';
import { auditLogs, customFields, customTabs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getRequestTenant, getRequestUserId } from '../lib/tenantContext.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

declare module 'fastify' {
  interface FastifyRequest {
    auditContext?: {
      entityType: 'custom_tab' | 'custom_field';
      entityId: string;
      previousState: unknown | null;
    };
  }
}

export async function auditPreHandler(request: FastifyRequest) {
  if (request.method === 'GET') return;

  const url = request.url;
  const entityType = url.includes('/fields') ? 'custom_field' : 'custom_tab';
  const params = request.params as { tabId?: string; fieldId?: string };
  const entityId = params.fieldId || params.tabId || 'bulk_reorder';
  const tenantSubdomain = getRequestTenant();

  if (!tenantSubdomain) return;
  const db = activeDb();

  let previousState = null;
  if (['PATCH', 'DELETE'].includes(request.method) && entityId !== 'bulk_reorder') {
    if (entityType === 'custom_field') {
      [previousState] = await db
        .select()
        .from(customFields)
        .where(
          and(
            eq(customFields.workspaceSubdomain, tenantSubdomain),
            eq(customFields.id, entityId)
          )
        );
    } else {
      [previousState] = await db
        .select()
        .from(customTabs)
        .where(
          and(
            eq(customTabs.workspaceSubdomain, tenantSubdomain),
            eq(customTabs.id, entityId)
          )
        );
    }
  }

  request.auditContext = { entityType, entityId, previousState };
}

export async function auditOnResponse(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.method === 'GET' || !request.auditContext || reply.statusCode >= 400) return;

  const tenantSubdomain = getRequestTenant();
  const userId = getRequestUserId() ?? (request as AuthenticatedRequest).user?.id;

  if (!tenantSubdomain || !userId) return;
  const db = activeDb();

  try {
    await db.insert(auditLogs).values({
      workspaceSubdomain: tenantSubdomain,
      tableName: request.auditContext.entityType,
      recordId: request.auditContext.entityId,
      action: request.method,
      oldValues: request.auditContext.previousState ?? null,
      newValues: request.body ?? null,
      userId,
    });
  } catch (err) {
    request.log.error({ err }, 'Audit logging execution failed');
  }
}
