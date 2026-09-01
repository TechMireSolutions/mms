import React from 'react';
import { LayoutDashboard, Building2, BarChart3, Activity, Server, ShieldCheck, User, PlusCircle } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import { ROUTES } from '@/lib/config/routes';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';

/** A console palette entry: static route command or dynamic workspace link. */
export interface PlatformCommandItem {
  id: string;
  labelKey?: AppTranslationKey;
  customLabel?: string;
  customSubtitle?: string;
  category: 'platform.commandCategory.navigation' | 'platform.commandCategory.actions' | 'platform.manageMadrasas';
  path: string;
  icon: React.ElementType;
  keywords: string[];
  requiredPermission?: 'workspaces' | 'onboard' | 'system' | 'admins';
}

export const PLATFORM_STATIC_COMMANDS: PlatformCommandItem[] = [
  {
    id: 'dashboard',
    labelKey: 'dashboard.title',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformDashboard,
    icon: LayoutDashboard,
    keywords: ['home', 'overview', 'metrics', 'stats', 'kpi', 'dashboard'],
  },
  {
    id: 'workspaces',
    labelKey: 'platform.manageMadrasas',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformWorkspaces,
    icon: Building2,
    keywords: ['madrasas', 'workspaces', 'tenants', 'subdomains', 'instances'],
    requiredPermission: 'workspaces',
  },
  {
    id: 'reports',
    labelKey: 'module.reports',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformReports,
    icon: BarChart3,
    keywords: ['analytics', 'reports', 'charts', 'distribution', 'graphs'],
  },
  {
    id: 'activity-logs',
    labelKey: 'platform.activityLogsTitle',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformActivityLogs,
    icon: Activity,
    keywords: ['logs', 'audit', 'events', 'history', 'activity'],
    requiredPermission: 'system',
  },
  {
    id: 'system',
    labelKey: 'platform.systemMaintenance',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformSystem,
    icon: Server,
    keywords: ['system', 'health', 'database', 'postgres', 'rls', 'maintenance'],
    requiredPermission: 'system',
  },
  {
    id: 'admins',
    labelKey: 'platform.adminsTitle',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformAdmins,
    icon: ShieldCheck,
    keywords: ['admins', 'super_user', 'operators', 'users', 'access', 'rbac', 'permissions'],
    requiredPermission: 'admins',
  },
  {
    id: 'account',
    labelKey: 'platform.myAccount',
    category: 'platform.commandCategory.navigation',
    path: ROUTES.platformAccount,
    icon: User,
    keywords: ['account', 'profile', 'session', 'email', 'me', 'password', 'security'],
  },
  {
    id: 'migrations',
    labelKey: 'platform.profileMigrateRestart',
    category: 'platform.commandCategory.actions',
    path: ROUTES.platformSystem,
    icon: Server,
    keywords: ['migrations', 'drizzle', 'database', 'schema', 'reset', 'maintenance'],
    requiredPermission: 'system',
  },
  {
    id: 'onboard-madrasa',
    labelKey: 'auth.createMadrasa',
    category: 'platform.commandCategory.actions',
    path: ROUTES.onboarding,
    icon: PlusCircle,
    keywords: ['create', 'add', 'onboard', 'provision', 'new madrasa', 'tenant'],
    requiredPermission: 'onboard',
  },
];

/** Dynamic per-workspace palette entries (pre-filtered to the SearchBar `q` param on navigate). */
export function buildWorkspaceCommandItems(workspaces: PlatformWorkspaceRowData[]): PlatformCommandItem[] {
  return workspaces.map((ws) => ({
    id: `ws-${ws.subdomain}`,
    customLabel: ws.madrasaName,
    customSubtitle: ws.subdomain,
    category: 'platform.manageMadrasas',
    path: `${ROUTES.platformWorkspaces}?q=${encodeURIComponent(ws.subdomain)}`,
    icon: Building2,
    keywords: [ws.subdomain, ws.madrasaName, ws.enabled ? 'active' : 'inactive'],
  }));
}

/** Palette item visibility gate: `undefined` means everyone. */
export function commandItemIsPermitted(
  item: PlatformCommandItem,
  perms: { canWorkspaces: boolean; canOnboard: boolean; canSystem: boolean; canAdmins: boolean },
): boolean {
  if (!item.requiredPermission) return true;
  if (item.requiredPermission === 'workspaces') return perms.canWorkspaces;
  if (item.requiredPermission === 'onboard') return perms.canOnboard;
  if (item.requiredPermission === 'system') return perms.canSystem;
  if (item.requiredPermission === 'admins') return perms.canAdmins;
  return true;
}