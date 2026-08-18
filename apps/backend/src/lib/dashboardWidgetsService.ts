import type { DashboardWidgetDto } from '@mms/shared';
import { getRequestTenant } from './tenantContext.js';
import { broadcastCollection } from './livePush.js';
import {
  listDashboardWidgetsByWorkspace,
  upsertDashboardWidgetsForWorkspace,
  deleteDashboardWidgetById,
} from '../db/repositories/dashboardWidgetsRepository.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

/** Load all dashboard widgets for the current workspace. */
export async function loadDashboardWidgets(): Promise<DashboardWidgetDto[]> {
  return listDashboardWidgetsByWorkspace(requireTenant());
}

/** Bulk upsert widgets (insert + update; rows absent from the payload are untouched). */
export async function upsertDashboardWidgets(
  widgets: DashboardWidgetDto[],
): Promise<DashboardWidgetDto[]> {
  const tenant = requireTenant();
  await upsertDashboardWidgetsForWorkspace(tenant, widgets);
  await broadcastCollection('dashboard');
  return listDashboardWidgetsByWorkspace(tenant);
}

/** Delete a single widget by id and broadcast the change. */
export async function deleteDashboardWidget(id: string): Promise<void> {
  await deleteDashboardWidgetById(requireTenant(), id);
  await broadcastCollection('dashboard');
}