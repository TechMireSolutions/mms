import React from "react";
import { LayoutDashboard, Building2, BarChart3, Users, User, Server, Activity } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import type { AppTranslationKey } from "@mms/shared";
import type { PlatformPermissionsState } from "@/platform/hooks/usePlatformPermissions";

export interface PlatformNavItem {
  id: string;
  path: string;
  labelKey: AppTranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: (perms: PlatformPermissionsState) => boolean;
}

/**
 * Single Source of Truth (SSOT) registry for Platform Apex navigation items.
 * Drives desktop sidebar navigation and mobile drawer.
 */
export const PLATFORM_NAV_ITEMS: readonly PlatformNavItem[] = [
  {
    id: "dashboard",
    path: ROUTES.platformDashboard,
    labelKey: "dashboard.title",
    icon: LayoutDashboard,
    isVisible: () => true,
  },
  {
    id: "workspaces",
    path: ROUTES.platformWorkspaces,
    labelKey: "platform.manageMadrasas",
    icon: Building2,
    isVisible: (perms) => perms.canWorkspaces,
  },
  {
    id: "reports",
    path: ROUTES.platformReports,
    labelKey: "module.reports",
    icon: BarChart3,
    isVisible: (perms) => perms.canWorkspaces,
  },
  {
    id: "activityLogs",
    path: ROUTES.platformActivityLogs,
    labelKey: "platform.activityLogsTitle",
    icon: Activity,
    isVisible: (perms) => perms.canSystem,
  },
  {
    id: "system",
    path: ROUTES.platformSystem,
    labelKey: "platform.systemMaintenance",
    icon: Server,
    isVisible: (perms) => perms.canSystem,
  },
  {
    id: "admins",
    path: ROUTES.platformAdmins,
    labelKey: "platform.adminsTitle",
    icon: Users,
    isVisible: (perms) => perms.canAdmins,
  },
  {
    id: "account",
    path: ROUTES.platformAccount,
    labelKey: "platform.myAccount",
    icon: User,
    isVisible: () => true,
  },
] as const;

/**
 * Filtered navigation items for the currently logged-in platform user.
 */
export function getVisiblePlatformNavItems(
  perms: PlatformPermissionsState,
): PlatformNavItem[] {
  return PLATFORM_NAV_ITEMS.filter((item) => item.isVisible(perms));
}
