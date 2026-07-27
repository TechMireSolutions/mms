import type { Permission } from './permissions.js';
import { DASHBOARD_PREFERENCES_KEY, DASHBOARD_WIDGETS_KEY } from './settingsTypes.js';

/**
 * Dashboard home shell contract — not a three-tier CRUD module.
 * Owns layout prefs / pinned widgets and customize permission only.
 */
export const DASHBOARD_MODULE_CONTRACT = {
  moduleId: 'dashboard',
  entityType: 'Dashboard',
  preferencesObjectKey: DASHBOARD_PREFERENCES_KEY,
  widgetsObjectKey: DASHBOARD_WIDGETS_KEY,
  tiers: [] as const,
  permissions: {
    /** View home dashboard (authenticated tenants; coarse gate via analytics). */
    read: 'analytics.view',
    /** Customize metric cards and pinned widgets. */
    customize: 'configuration.view',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
  } satisfies Record<string, Permission>,
} as const;

export type DashboardModulePermission = keyof typeof DASHBOARD_MODULE_CONTRACT.permissions;
