import { useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Building2, BarChart3, Settings, LayoutDashboard, Activity, Server, ShieldCheck, Waypoints } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { ROUTES } from '@/lib/config/routes';
import type { AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
import type { PlatformWorkSubTab } from '@/platform/components/tiers/PlatformWorkTier';
import type { PlatformReportsSubTab } from '@/platform/components/tiers/PlatformReportsTier';
import type { PlatformSetupSubTab } from '@/platform/components/tiers/PlatformSetupTier';

export type PlatformMainTab = 'work' | 'reports' | 'setup';

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
    if (rawTab === 'reports' || pathname === ROUTES.platformReports) return 'reports';
    if (rawTab === 'setup' || pathname === ROUTES.platformSystem || pathname === ROUTES.platformAdmins || pathname === ROUTES.platformErd) return 'setup';
    if (rawTab === 'work' || pathname === ROUTES.platformWorkspaces || pathname === ROUTES.platformActivityLogs) return 'work';
    if (pathname === ROUTES.platformDashboard) return 'reports';
    if (canWorkspaces) return 'work';
    if (canAdmins || canSystem) return 'setup';
    return 'work';
  }, [rawTab, pathname, canWorkspaces, canAdmins, canSystem]);

  const activeWorkSubTab: PlatformWorkSubTab = useMemo(() => {
    if (pathname === ROUTES.platformActivityLogs || rawSubTab === 'logs') {
      return canSystem ? 'logs' : 'workspaces';
    }
    return 'workspaces';
  }, [pathname, rawSubTab, canSystem]);

  const activeReportsSubTab: PlatformReportsSubTab = useMemo(() => {
    if (pathname === ROUTES.platformDashboard || rawSubTab === 'telemetry') {
      return 'telemetry';
    }
    return 'analytics';
  }, [pathname, rawSubTab]);

  const activeSetupSubTab: PlatformSetupSubTab = useMemo(() => {
    if (pathname === ROUTES.platformSystem || rawSubTab === 'system') return 'system';
    if (pathname === ROUTES.platformErd || rawSubTab === 'erd') return 'erd';
    if (pathname === ROUTES.platformAdmins || rawSubTab === 'admins') return 'admins';
    return canAdmins ? 'admins' : 'system';
  }, [pathname, rawSubTab, canAdmins]);

  const handleTabChange = useCallback((tabId: string) => {
    const validTab = (tabId === 'reports' || tabId === 'setup' || tabId === 'work') ? tabId : 'work';
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
    const userName = platformUser?.name ?? '';
    const userSubtitle = isSuperUser
      ? t('platform.consoleSubtitle', { name: userName })
      : t('platform.adminConsoleSubtitle', { name: userName });

    if (pathname === ROUTES.platformDashboard) {
      return {
        icon: LayoutDashboard,
        title: t('dashboard.title'),
        subtitle: userSubtitle,
      };
    }

    if (activeTab === 'work') {
      if (activeWorkSubTab === 'logs') {
        return {
          icon: Activity,
          title: t('platform.activityLogsTitle'),
          subtitle: t('platform.activityLogsSubtitle'),
        };
      }
      return {
        icon: Building2,
        title: t('platform.manageMadrasas'),
        subtitle: userSubtitle,
      };
    }

    if (activeTab === 'reports') {
      return {
        icon: BarChart3,
        title: t('module.reports'),
        subtitle: userSubtitle,
      };
    }

    if (activeSetupSubTab === 'system') {
      return {
        icon: Server,
        title: t('platform.systemMaintenance'),
        subtitle: t('platform.systemMaintenanceSubtitle'),
      };
    }
    if (activeSetupSubTab === 'erd') {
      return {
        icon: Waypoints,
        title: t('platform.erdTitle'),
        subtitle: t('platform.erdSubtitle'),
      };
    }
    return {
      icon: ShieldCheck,
      title: t('platform.adminsTitle'),
      subtitle: t('platform.adminsSubtitle'),
    };
  }, [pathname, activeTab, activeWorkSubTab, activeSetupSubTab, isSuperUser, platformUser, t]);

  return {
    t,
    perms,
    activeTab,
    activeWorkSubTab,
    activeReportsSubTab,
    activeSetupSubTab,
    topTabs,
    headerProps,
    handleTabChange,
    handleWorkSubTabChange,
    handleReportsSubTabChange,
    handleSetupSubTabChange,
  };
}
