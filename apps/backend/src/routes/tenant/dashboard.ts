import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  DASHBOARD_MODULE_MANIFEST,
  roleHasPermission,
  dashboardPreferencesPutBodySchema,
  dashboardWidgetsPutBodySchema,
  normalizeDashboardPreferences,
  type DashboardPreferences,
  type DashboardWidgetDto,
  type User,
} from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { createCollectionAuditHelper } from '../../lib/createCollectionAuditHelper.js';
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
} from '../../lib/dashboardPreferencesService.js';
import {
  loadDashboardWidgets,
  upsertDashboardWidgets,
  deleteDashboardWidget,
} from '../../lib/dashboardWidgetsService.js';

const auditDashboard = createCollectionAuditHelper('dashboard');

/** Dashboard is the always-on home — any authenticated tenant may read; setupWrite gates mutations. */
function canWriteDashboard(user: User): boolean {
  return roleHasPermission(user.role, DASHBOARD_MODULE_MANIFEST.permissions.setupWrite);
}

/**
 * Server-authoritative dashboard layout/preferences + pinned widgets REST.
 * Preferences-only (no field-config) + normalized widgets collection (GET / PUT upsert / DELETE :id).
 */
export default async function dashboardRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/preferences', async (_request, reply) => {
    try {
      const preferences = await loadDashboardPreferences();
      return reply.send({
        preferences: preferences ?? normalizeDashboardPreferences(null),
      });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load dashboard preferences', error);
    }
  });

  fastify.put('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteDashboard(user)) return sendForbidden(reply);
    const body = parseRequest(dashboardPreferencesPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await saveDashboardPreferences(
        normalizeDashboardPreferences(body.data) as DashboardPreferences,
      );
      try {
        await auditDashboard(user, 'dashboard.preferences', 'Updated dashboard preferences', 'preferences');
      } catch (auditError) {
        fastify.log.warn({ err: auditError }, 'Failed to record dashboard preferences audit log');
      }
      return reply.send({ success: true, preferences: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save dashboard preferences', error);
    }
  });

  fastify.get('/widgets', async (_request, reply) => {
    try {
      const widgets = await loadDashboardWidgets();
      return reply.send({ widgets });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load dashboard widgets', error);
    }
  });

  fastify.put('/widgets', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteDashboard(user)) return sendForbidden(reply);
    const body = parseRequest(dashboardWidgetsPutBodySchema, request.body);
    if (!body.ok) {
      fastify.log.warn({ err: body.message, body: request.body }, 'Dashboard widgets PUT validation failed');
      return replyValidationError(reply, body.message);
    }
    try {
      const widgets = await upsertDashboardWidgets(body.data as DashboardWidgetDto[]);
      try {
        await auditDashboard(user, 'dashboard.widgets', 'Updated dashboard widgets', 'widgets');
      } catch (auditError) {
        fastify.log.warn({ err: auditError }, 'Failed to record dashboard widgets audit log');
      }
      return reply.send({ success: true, widgets });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save dashboard widgets', error);
    }
  });

  fastify.delete('/widgets/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteDashboard(user)) return sendForbidden(reply);
    const { id } = request.params as { id: string };
    if (!id?.trim()) return replyValidationError(reply, 'Widget id is required');
    try {
      await deleteDashboardWidget(id);
      try {
        await auditDashboard(user, 'dashboard.widget.delete', `Deleted dashboard widget ${id}`, id);
      } catch (auditError) {
        fastify.log.warn({ err: auditError }, 'Failed to record dashboard widget delete audit log');
      }
      return reply.send({ success: true });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to delete dashboard widget', error);
    }
  });
}