import type { FastifyPluginAsync } from 'fastify';
import {
  DASHBOARD_MODULE_MANIFEST,
  roleHasPermission,
  rootContract,
  normalizeDashboardPreferences,
  type DashboardPreferences,
  type DashboardWidgetDto,
  type User,
} from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { withTenant } from '../../db/tenant-context.js';
import { createCollectionAuditHelper } from '../../lib/createCollectionAuditHelper.js';
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
} from '../../services/dashboardPreferencesService.js';
import {
  loadDashboardWidgets,
  upsertDashboardWidgets,
  deleteDashboardWidget,
} from '../../lib/dashboardWidgetsService.js';

const auditDashboard = createCollectionAuditHelper('dashboard');
const s = initServer();

function canWriteDashboard(user: User): boolean {
  if (!user || !user.role) return false;
  const role = String(user.role).toLowerCase();
  if (role === 'admin' || role === 'owner') return true;
  return (
    roleHasPermission(role, DASHBOARD_MODULE_MANIFEST.permissions.setupWrite) ||
    roleHasPermission(role, DASHBOARD_MODULE_MANIFEST.permissions.customize)
  );
}

const dashboardRouter = s.router(rootContract.dashboard, {
  getPreferences: async ({ request }: any) => {
    try {
      const preferences = await withTenant(String((request as any).tenant?.id), () => loadDashboardPreferences(), { readOnly: true, statementTimeoutMs: 5000 });
      return {
        status: 200 as const,
        body: { preferences: preferences ?? normalizeDashboardPreferences(null) },
      };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load dashboard preferences' } as any };
    }
  },
  putPreferences: async ({ body, request }: any) => {
    const user = (request as any).user as User;
    if (!canWriteDashboard(user)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } as any };
    }
    try {
      const saved = await withTenant(String((request as any).tenant?.id), async () => {
        const result = await saveDashboardPreferences(
          normalizeDashboardPreferences(body as DashboardPreferences) as DashboardPreferences,
        );
        try {
          await auditDashboard(user, 'dashboard.preferences', 'Updated dashboard preferences', 'preferences');
        } catch { /* non-critical */ }
        return result;
      }, { readOnly: false });
      return { status: 200 as const, body: { success: true, preferences: saved } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to save dashboard preferences' } as any };
    }
  },
  getWidgets: async ({ request }: any) => {
    try {
      const widgets = await withTenant(String((request as any).tenant?.id), () => loadDashboardWidgets(), { readOnly: true, statementTimeoutMs: 5000 });
      return { status: 200 as const, body: { widgets } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load dashboard widgets' } as any };
    }
  },
  putWidgets: async ({ body, request }: any) => {
    const user = (request as any).user as User;
    if (!canWriteDashboard(user)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } as any };
    }
    try {
      const widgets = await withTenant(String((request as any).tenant?.id), async () => {
        const result = await upsertDashboardWidgets(body as DashboardWidgetDto[]);
        try {
          await auditDashboard(user, 'dashboard.widgets', 'Updated dashboard widgets', 'widgets');
        } catch { /* non-critical */ }
        return result;
      }, { readOnly: false });
      return { status: 200 as const, body: { success: true, widgets } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to save dashboard widgets' } as any };
    }
  },
  deleteWidget: async ({ params: { id }, request }: any) => {
    const user = (request as any).user as User;
    if (!canWriteDashboard(user)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } as any };
    }
    if (!id?.trim()) {
      return { status: 400 as const, body: { type: 'validation_error', message: 'Widget id is required' } as any };
    }
    try {
      await withTenant(String((request as any).tenant?.id), async () => {
        await deleteDashboardWidget(id);
        try {
          await auditDashboard(user, 'dashboard.widget.delete', `Deleted dashboard widget ${id}`, id);
        } catch { /* non-critical */ }
      }, { readOnly: false });
      return { status: 200 as const, body: { success: true } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete dashboard widget' } as any };
    }
  },
} as any);

/**
 * Server-authoritative dashboard layout/preferences + pinned widgets REST.
 * Migrated to @ts-rest contract router (Phase 3).
 */
const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticateTenant);
  await fastify.register(s.plugin(dashboardRouter));
};

export default dashboardRoutes;
