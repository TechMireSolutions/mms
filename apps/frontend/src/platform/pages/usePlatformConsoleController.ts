import { useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Building2, BarChart3, Settings, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { ROUTES } from '@/lib/config/routes';
import type { AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
import type { PlatformWorkSubTab } from '@/platform/components/tiers/PlatformWorkTier';
import type { PlatformUsersSubTab } from '@/platform/components/tiers/PlatformUsersTier';
import type { PlatformReportsSubTab } from '@/platform/components/tiers/PlatformReportsTier';
import type { PlatformSetupSubTab } from '@/platform/components/tiers/PlatformSetupTier';
import { getPlatformConsoleHeaderProps, type PlatformMainTab } from './platformConsoleHeaderProps';

export type { PlatformMainTab };

export function usePlatformConsoleController() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const perms = usePlatformPermissions();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard, canSystem, canAdmins } = perms;

  const pathname = location.pathname;
  const rawTab = searchParams.get('tab');
  const rawSubTab = searchParams.get('subtab');

  const activeTab: PlatformMainTab = useMemo(() => {
    if (rawTab === 'users' || pathname === ROUTES.platformUsers) return 'users';
    if (rawTab === 'reports' || pathname === ROUTES.platformReports) return 'reports';
    if (rawTab === 'setup' || pathname === ROUTES.platformSystem || pathname === ROUTES.platformAdmins || pathname === ROUTES.platformErd) return 'setup';
    if (rawTab === 'work' || pathname === ROUTES.platformWorkspaces || pathname === ROUTES.platformActivityLogs) return 'work';
    if (pathname === ROUTES.platformDashboard) return 'reports';
    if (canWorkspaces) return 'work';
    if (canAdmins) return 'users';
    if (canSystem) return 'setup';
    return 'work';
  }, [rawTab, pathname, canWorkspaces, canAdmins, canSystem]);

  const activeWorkSubTab: PlatformWorkSubTab = useMemo(() => {
    if (pathname === ROUTES.platformActivityLogs || rawSubTab === 'logs') {
      return canSystem ? 'logs' : 'workspaces';
    }
    return 'workspaces';
  }, [pathname, rawSubTab, canSystem]);

  const activeUsersSubTab: PlatformUsersSubTab = useMemo(() => {
    if (rawSubTab === 'reports') return 'reports';
    if (rawSubTab === 'setup') return 'setup';
    return 'work';
  }, [rawSubTab]);

  const activeReportsSubTab: PlatformReportsSubTab = 'analytics';

  const activeSetupSubTab: PlatformSetupSubTab = useMemo(() => {
    if (pathname === ROUTES.platformSystem || rawSubTab === 'system') return 'system';
    if (pathname === ROUTES.platformErd || rawSubTab === 'erd') return 'erd';
    if (pathname === ROUTES.platformAdmins || rawSubTab === 'admins') return 'admins';
    return canAdmins ? 'admins' : 'system';
  }, [pathname, rawSubTab, canAdmins]);

  const handleTabChange = useCallback((tabId: string) => {
    const validTab = (tabId === 'users' || tabId === 'reports' || tabId === 'setup' || tabId === 'work') ? tabId : 'work';
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', validTab);
      next.delete('subtab');
      return next;
    });
  }, [setSearchParams]);

  const handleWorkSubTabChange = useCallback((subTab: PlatformWorkSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'work');
      next.set('subtab', subTab);
      return next;
    });
  }, [setSearchParams]);

  const handleUsersSubTabChange = useCallback((subTab: PlatformUsersSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'users');
      next.set('subtab', subTab);
      return next;
    });
  }, [setSearchParams]);

  const handleReportsSubTabChange = useCallback((subTab: PlatformReportsSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'reports');
      next.set('subtab', subTab);
      return next;
    });
  }, [setSearchParams]);

  const handleSetupSubTabChange = useCallback((subTab: PlatformSetupSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'setup');
      next.set('subtab', subTab);
      return next;
    });
  }, [setSearchParams]);

  const topTabs: AccordionTabItem[] = useMemo(() => {
    const tabs: AccordionTabItem[] = [];
    if (canWorkspaces || canSystem) {
      tabs.push({
        id: 'work',
        label: t('module.work'),
        description: t('module.workHint'),
        icon: Building2,
      });
    }
    if (canAdmins) {
      tabs.push({
        id: 'users',
        label: t('nav.users'),
        description: t('platform.adminsSubtitle'),
        icon: Users,
      });
    }
    if (canWorkspaces) {
      tabs.push({
        id: 'reports',
        label: t('module.reports'),
        description: t('module.reportsHint'),
        icon: BarChart3,
      });
    }
    if (canAdmins || canSystem) {
      tabs.push({
        id: 'setup',
        label: t('module.setup'),
        description: t('module.setupHint'),
        icon: Settings,
      });
    }
    return tabs;
  }, [canWorkspaces, canSystem, canAdmins, t]);

  const headerProps = useMemo(() => {
    return getPlatformConsoleHeaderProps({
      pathname,
      activeTab,
      activeWorkSubTab,
      activeSetupSubTab,
      isSuperUser,
      platformUser,
      t,
    });
  }, [pathname, activeTab, activeWorkSubTab, activeSetupSubTab, isSuperUser, platformUser, t]);

  return {
    t,
    perms,
    activeTab,
    activeWorkSubTab,
    activeUsersSubTab,
    activeReportsSubTab,
    activeSetupSubTab,
    topTabs,
    headerProps,
    handleTabChange,
    handleWorkSubTabChange,
    handleUsersSubTabChange,
    handleReportsSubTabChange,
    handleSetupSubTabChange,
  };
}
