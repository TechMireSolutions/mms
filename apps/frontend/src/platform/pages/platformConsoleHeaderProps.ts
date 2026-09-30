import type React from 'react';
import {
  Building2,
  BarChart3,
  LayoutDashboard,
  Activity,
  Server,
  ShieldCheck,
  Waypoints,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { PlatformWorkSubTab } from '@/platform/components/tiers/PlatformWorkTier';
import type { PlatformSetupSubTab } from '@/platform/components/tiers/PlatformSetupTier';

export type PlatformMainTab = 'work' | 'users' | 'reports' | 'setup';

export interface HeaderPropsParams {
  pathname: string;
  activeTab: PlatformMainTab;
  activeWorkSubTab: PlatformWorkSubTab;
  activeSetupSubTab: PlatformSetupSubTab;
  isSuperUser: boolean;
  platformUser?: { name?: string | null } | null;
  t: TranslationFunction;
}

export interface HeaderPropsResult {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}

export function getPlatformConsoleHeaderProps(params: HeaderPropsParams): HeaderPropsResult {
  const { pathname, activeTab, activeWorkSubTab, activeSetupSubTab, isSuperUser, platformUser, t } = params;
  const userName = platformUser?.name ?? '';
  const userSubtitle = isSuperUser
    ? t('platform.consoleSubtitle', { name: userName })
    : t('platform.adminConsoleSubtitle', { name: userName });

  if (pathname === ROUTES.platformDashboard) {
    return { icon: LayoutDashboard, title: t('dashboard.title'), subtitle: userSubtitle };
  }
  if (activeTab === 'work') {
    if (activeWorkSubTab === 'logs') {
      return { icon: Activity, title: t('platform.activityLogsTitle'), subtitle: t('platform.activityLogsSubtitle') };
    }
    return { icon: Building2, title: t('platform.manageMadrasas'), subtitle: userSubtitle };
  }
  if (activeTab === 'users') {
    return { icon: Users, title: t('nav.users'), subtitle: userSubtitle };
  }
  if (activeTab === 'reports') {
    return { icon: BarChart3, title: t('module.reports'), subtitle: userSubtitle };
  }
  if (activeSetupSubTab === 'system') {
    return { icon: Server, title: t('platform.systemMaintenance'), subtitle: t('platform.systemMaintenanceSubtitle') };
  }
  if (activeSetupSubTab === 'erd') {
    return { icon: Waypoints, title: t('platform.erdTitle'), subtitle: t('platform.erdSubtitle') };
  }
  return { icon: ShieldCheck, title: t('platform.adminsTitle'), subtitle: t('platform.adminsSubtitle') };
}
