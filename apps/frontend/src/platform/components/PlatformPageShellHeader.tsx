import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { usePlatformHealth } from '@/platform/hooks/usePlatformHealth';
import { Button } from '@/components/ui/button';
import { ROUTES, isNavPathActive } from '@/lib/config/routes';
import { PLATFORM_NAV_ITEMS } from '@/platform/lib/platformNav';
import { PlatformHeaderBrand } from '@/platform/components/header/PlatformHeaderBrand';
import { PlatformHeaderUserNav } from '@/platform/components/header/PlatformHeaderUserNav';

export interface PlatformPageShellHeaderProps {
  onOpenSearch?: () => void;
  searchOpen?: boolean;
}

const healthBadge = cva(
  'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs sm:text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer border',
  {
    variants: {
      status: {
        operational: 'bg-success/10 text-success border-success/20',
        degraded: 'bg-warning/10 text-warning border-warning/20',
        unknown: 'bg-muted text-muted-foreground border-border/40',
      },
    },
    defaultVariants: { status: 'unknown' },
  },
);

const healthDot = cva('w-2 h-2 rounded-full', {
  variants: {
    status: {
      operational: 'bg-success animate-pulse',
      degraded: 'bg-warning animate-pulse',
      unknown: 'bg-muted-foreground',
    },
  },
  defaultVariants: { status: 'unknown' },
});

type HealthStatus = 'operational' | 'degraded' | 'unknown';

export function PlatformPageShellHeader({
  onOpenSearch,
  searchOpen = false,
}: PlatformPageShellHeaderProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const location = useLocation();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated } = perms;
  const { openMobileSidebar } = usePlatformSidebar();
  const { status: rawStatus } = usePlatformHealth();
  const status = (rawStatus as HealthStatus | undefined) ?? 'unknown';

  if (!isPlatformAuthenticated) return null;

  const activeNavItem = PLATFORM_NAV_ITEMS.find((item) => isNavPathActive(location.pathname, item.path));

  const healthLabel =
    status === 'operational'
      ? t('platform.statusOperational')
      : status === 'degraded'
        ? t('platform.statusDegraded')
        : t('platform.statusUnknown');

  return (
    <div className="sticky top-0 z-header w-full border-b border-border bg-card/80 backdrop-blur-xl transition-all duration-300">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side Controls */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openMobileSidebar}
            aria-label={t('nav.openMenu')}
            className="md:hidden flex min-h-11 min-w-11 h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile Brand Logo */}
          <div className="md:hidden">
            <PlatformHeaderBrand />
          </div>

          {/* Desktop Breadcrumb Trail */}
          <nav aria-label={t('common.breadcrumb')} className="hidden md:flex items-center gap-2 text-xs">
            <Link
              to={ROUTES.platformDashboard}
              className="font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('platform.consoleTitle')}
            </Link>
            {activeNavItem && activeNavItem.path !== ROUTES.platformDashboard ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 rtl:rotate-180" aria-hidden />
                <span className="font-bold text-foreground">{t(activeNavItem.labelKey)}</span>
              </>
            ) : null}
          </nav>

          {/* Health Status Badge */}
          <Link
            to={ROUTES.platformSystem}
            className={healthBadge({ status })}
            title={t('platform.systemMaintenance')}
            aria-label={`${t('platform.systemMaintenance')}: ${healthLabel}`}
          >
            <span className={healthDot({ status })} />
            {healthLabel}
          </Link>
        </div>

        {/* Right Side Header User Actions */}
        <PlatformHeaderUserNav
          onOpenSearch={onOpenSearch}
          searchOpen={searchOpen}
          className="ms-auto"
        />
      </div>
    </div>
  );
}
