import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, ShieldAlert, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { getVisiblePlatformNavItems, type PlatformNavSection, type PlatformNavItem } from '@/platform/lib/platformNav';
import { useOverlayBehavior } from '@/hooks/useOverlayBehavior';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/config/routes';
import { OVERLAY_BACKDROP } from '@/components/ui/formStyles';
import { PlatformSidebarNav } from '@/platform/components/PlatformSidebarNav';

export function PlatformSidebar(): React.JSX.Element | null {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, platformLogout } = usePlatformAuth();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated, isSuperUser } = perms;
  const { mobileOpen, closeMobileSidebar, collapsed, toggleCollapsed, openCommandPalette } = usePlatformSidebar();
  const [openedAt, setOpenedAt] = useState<number>(0);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState<boolean>(false);

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
        <PlatformSidebarNav
          sections={sections}
          collapsed={collapsed}
          isMobile={isMobile}
          reducedMotion={reducedMotion}
          closeMobileSidebar={closeMobileSidebar}
        />
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
            <UserAvatar
              name={platformUser?.name}
              className="h-9 w-9 ring-1 ring-sidebar-border group-hover:ring-sidebar-primary/50 transition-all"
              fallbackClassName="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold"
            />
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
            onClick={() => setConfirmSignOutOpen(true)}
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

      <ConfirmAlertDialog
        open={confirmSignOutOpen}
        onOpenChange={setConfirmSignOutOpen}
        title={t('platform.signOut')}
        description={t('platform.signOutConfirm')}
        confirmLabel={t('platform.signOut')}
        destructive
        onConfirm={() => {
          closeMobileSidebar();
          void platformLogout();
        }}
      />
    </>
  );
}

export default PlatformSidebar;