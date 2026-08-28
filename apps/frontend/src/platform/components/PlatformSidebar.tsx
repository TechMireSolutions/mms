import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, ShieldAlert, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { getVisiblePlatformNavItems, type PlatformNavSection, type PlatformNavItem } from '@/platform/lib/platformNav';
import { useOverlayBehavior } from '@/hooks/useOverlayBehavior';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { isNavPathActive, ROUTES } from '@/lib/config/routes';
import { prefetchRoute } from '@/lib/routing/routePrefetch';
import { OVERLAY_BACKDROP } from '@/components/ui/formStyles';
import { getInitials, type AppTranslationKey } from '@mms/shared';

const SECTION_LABEL_KEYS: Record<PlatformNavSection, AppTranslationKey | null> = {
  core: 'platform.nav.sectionOverview',
  admin: 'platform.nav.sectionAdmin',
  ops: 'platform.nav.sectionOps',
  account: null,
};

export function PlatformSidebar(): React.JSX.Element | null {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, platformLogout } = usePlatformAuth();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated, isSuperUser } = perms;
  const { mobileOpen, closeMobileSidebar, collapsed, toggleCollapsed, openCommandPalette } = usePlatformSidebar();
  const location = useLocation();
  const [openedAt, setOpenedAt] = useState<number>(0);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    if (mobileOpen) {
      setOpenedAt(Date.now());
    }
  }, [mobileOpen]);

  const drawerRef = useOverlayBehavior<HTMLDivElement>({
    open: mobileOpen,
    onClose: closeMobileSidebar,
  });

  if (!isPlatformAuthenticated) return null;

  const initials = getInitials(platformUser?.name, 2) || 'OP';
  const navItems = getVisiblePlatformNavItems(perms);

  // Group items by section
  const sections: { section: PlatformNavSection; items: PlatformNavItem[] }[] = [];
  const sectionMap = new Map<PlatformNavSection, PlatformNavItem[]>();

  for (const item of navItems) {
    if (!sectionMap.has(item.section)) {
      sectionMap.set(item.section, []);
    }
    sectionMap.get(item.section)!.push(item);
  }

  for (const [section, items] of sectionMap.entries()) {
    sections.push({ section, items });
  }


  const renderNav = (isMobile = false) => (
    <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto" aria-label={t('platform.navAria')}>
      {sections.map(({ section, items }, sIndex) => {
        const sectionTitleKey = SECTION_LABEL_KEYS[section];
        const showHeader = !collapsed || isMobile;

        return (
          <div key={section} className="space-y-1">
            {showHeader && sectionTitleKey && (
              <div className={cn('px-3 pb-1 text-2xs uppercase tracking-wider font-mono text-sidebar-muted-foreground/80 font-bold', sIndex > 0 ? 'pt-2' : '')}>
                {t(sectionTitleKey)}
              </div>
            )}

            {items.map((item) => {
              const Icon = item.icon;
              const isActive = isNavPathActive(location.pathname, item.path);
              const label = t(item.labelKey);

              const linkNode = (
                <Link
                  key={item.id}
                  to={item.path}
                  onMouseEnter={() => prefetchRoute(item.path)}
                  onFocus={() => prefetchRoute(item.path)}
                  onClick={() => isMobile && closeMobileSidebar()}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative select-none cursor-pointer',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                      : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                    !isMobile && collapsed && 'justify-center px-0 min-w-11',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId={reducedMotion ? undefined : 'platform-sidebar-indicator'}
                      className="absolute start-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-sidebar-primary rounded-e-full"
                      transition={reducedMotion ? undefined : { type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-sidebar-primary' : '')} aria-hidden />
                  <AnimatePresence>
                    {(isMobile || !collapsed) && (
                      <motion.span
                        initial={reducedMotion ? false : { opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={reducedMotion ? undefined : { opacity: 0, width: 0 }}
                        className="text-sm font-medium overflow-hidden whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (!isMobile && collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-md">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkNode;
            })}
          </div>
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
            {!logoError ? (
              <img
                src="/platform-logo.webp"
                alt="Platform Logo"
                className="h-full w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <ShieldAlert className="w-5 h-5 text-sidebar-primary" />
            )}
          </div>
          <AnimatePresence>
            {(isMobile || !collapsed) && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={reducedMotion ? undefined : { opacity: 0, width: 0 }}
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
            className="h-11 w-11 min-h-11 min-w-11 text-sidebar-muted-foreground hover:text-sidebar-foreground shrink-0 rounded-lg cursor-pointer"
            aria-label={t('nav.closeSidebar')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Search Shortcut Trigger */}
      {(isMobile || !collapsed) && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openCommandPalette}
            className="w-full h-9 justify-between px-3 text-xs text-sidebar-muted-foreground border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-xl transition-all select-none cursor-pointer"
            aria-label={t('platform.nav.searchConsole')}
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" aria-hidden />
              {t('platform.nav.searchConsole')}
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-sidebar-border bg-card px-1.5 py-0.2 text-3xs font-mono font-bold text-sidebar-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
      )}

      {/* Navigation Links with Tooltips */}
      <TooltipProvider delayDuration={150}>
        {renderNav(isMobile)}
      </TooltipProvider>

      {/* Footer Section: User Profile & Collapse Toggle */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-2 shrink-0">
        {(isMobile || !collapsed) && (
          <Link
            to={ROUTES.platformAccount}
            onClick={() => isMobile && closeMobileSidebar()}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-sidebar-accent/50 transition-colors group cursor-pointer"
            aria-label={t('platform.myAccount')}
          >
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-sidebar-border group-hover:ring-sidebar-primary/50 transition-all">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-start min-w-0 flex-1">
              <span className="text-xs font-bold text-sidebar-foreground truncate group-hover:text-sidebar-primary transition-colors">{platformUser?.name}</span>
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
          </Link>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!window.confirm(t('platform.signOutConfirm'))) return;
              if (isMobile) closeMobileSidebar();
              void platformLogout();
            }}
            className={cn(
              'flex min-h-11 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer',
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
              onClick={toggleCollapsed}
              className="h-11 w-11 shrink-0 rounded-lg text-sidebar-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
              title={collapsed ? t('nav.expand') : t('nav.collapse')}
              aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
              aria-expanded={!collapsed}
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
        <div
          role="region"
          aria-label={t('nav.openMenu')}
          className="md:hidden fixed inset-0 z-sidebar-mobile flex"
        >
          <div
            className={cn("fixed inset-0", OVERLAY_BACKDROP, "transition-opacity duration-300")}
            onClick={() => {
              if (Date.now() - openedAt > 300) {
                closeMobileSidebar();
              }
            }}
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

export default PlatformSidebar;

