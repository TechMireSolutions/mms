import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { getVisiblePlatformNavItems } from '@/platform/lib/platformNav';
import { useOverlayBehavior } from '@/hooks/useOverlayBehavior';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { cn } from '@/lib/utils';
import { isNavPathActive, ROUTES } from '@/lib/config/routes';
import { prefetchRoute } from '@/lib/routing/routePrefetch';
import { getInitials } from '@mms/shared';

export function PlatformSidebar(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated, isSuperUser } = perms;
  const { mobileOpen, closeMobileSidebar } = usePlatformSidebar();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const drawerRef = useOverlayBehavior<HTMLDivElement>({
    open: mobileOpen,
    onClose: closeMobileSidebar,
  });

  if (!isPlatformAuthenticated) return null;

  const initials = getInitials(platformUser?.name, 2) || 'OP';
  const navItems = getVisiblePlatformNavItems(perms);

  const renderNav = (isMobile = false) => (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavPathActive(location.pathname, item.path);
        const label = t(item.labelKey);

        return (
          <Link
            key={item.id}
            to={item.path}
            onMouseEnter={() => prefetchRoute(item.path)}
            onFocus={() => prefetchRoute(item.path)}
            onClick={() => isMobile && closeMobileSidebar()}
            className={cn(
              'group flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative select-none',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
            )}
            title={!isMobile && collapsed ? label : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="platform-sidebar-indicator"
                className="absolute start-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-sidebar-primary rounded-e-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-sidebar-primary' : '')} />
            <AnimatePresence>
              {(isMobile || !collapsed) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full w-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <Link
          to={ROUTES.home}
          onClick={() => isMobile && closeMobileSidebar()}
          className="flex min-h-11 items-center gap-3 overflow-hidden hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-card border border-sidebar-primary/40 flex items-center justify-center shrink-0 shadow-xs p-1 overflow-hidden">
            <img src="/platform-logo.webp" alt="Platform Logo" className="h-full w-full object-contain" />
          </div>
          <AnimatePresence>
            {(isMobile || !collapsed) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap flex flex-col text-start"
              >
                <span className="text-sidebar-foreground font-semibold text-sm tracking-wide leading-tight">
                  {t('entry.productName')}
                </span>
                <span className="text-2xs font-mono text-sidebar-muted-foreground uppercase tracking-wider leading-tight mt-0.5">
                  {t('platform.consoleTitle')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => closeMobileSidebar()}
            className="h-11 w-11 min-h-11 min-w-11 text-sidebar-muted-foreground hover:text-sidebar-foreground shrink-0 rounded-lg"
            aria-label={t('nav.closeSidebar')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      {renderNav(isMobile)}

      {/* Footer Section: User Profile & Collapse Toggle */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-2 shrink-0">
        {(isMobile || !collapsed) && (
          <div className="flex items-center gap-3 px-1 py-1">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-start min-w-0 flex-1">
              <span className="text-xs font-bold text-sidebar-foreground truncate">{platformUser?.name}</span>
              <SectionLabel tracking="wider" className="flex items-center gap-1 mt-0.5 text-sidebar-muted-foreground truncate">
                {isSuperUser ? (
                  <>
                    <ShieldAlert className="w-2.5 h-2.5 text-sidebar-primary shrink-0" aria-hidden />
                    {t('platform.roleSuperUser')}
                  </>
                ) : (
                  t('platform.roleAdmin')
                )}
              </SectionLabel>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (isMobile) closeMobileSidebar();
              void platformLogout();
            }}
            className={cn(
              'flex min-h-11 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
              !isMobile && collapsed && 'justify-center px-0 min-w-11',
            )}
            title={t('platform.signOut')}
            aria-label={t('platform.signOut')}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(isMobile || !collapsed) && <span className="text-xs font-medium truncate">{t('platform.signOut')}</span>}
          </Button>

          {!isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-11 w-11 shrink-0 rounded-lg text-sidebar-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              title={collapsed ? t('nav.expand') : t('nav.collapse')}
              aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              ) : (
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay & Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-modal flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => closeMobileSidebar()}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.openMenu')}
            className="relative w-sidebar-mobile max-w-sheet bg-sidebar h-full shadow-2xl flex flex-col z-10 border-e border-sidebar-border"
          >
            {sidebarContent(true)}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex sticky top-0 h-screen shrink-0 border-e border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out flex-col justify-between select-none z-sidebar',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
        )}
        aria-label={t('platform.navAria')}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
