import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { getVisiblePlatformNavItems, type PlatformNavSection, type PlatformNavItem } from '@/platform/lib/platformNav';
import { useOverlayBehavior } from '@/hooks/useOverlayBehavior';
import { Button } from '@/components/ui/button';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { OVERLAY_BACKDROP } from '@/components/ui/formStyles';
import { PlatformSidebarNav } from '@/platform/components/PlatformSidebarNav';
import { PlatformSidebarBrand } from '@/platform/components/sidebar/PlatformSidebarBrand';
import { PlatformSidebarFooter } from '@/platform/components/sidebar/PlatformSidebarFooter';

/**
 * Mobile drawer for Platform Apex, mounted outside the desktop aside so it remains
 * fully visible and interactive on all viewports < 1024px.
 */
export function PlatformMobileSidebar(): React.JSX.Element | null {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, platformLogout } = usePlatformAuth();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated, isSuperUser } = perms;
  const { mobileOpen, closeMobileSidebar, openCommandPalette } = usePlatformSidebar();
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const openGestureActiveRef = useRef(false);

  useEffect(() => {
    if (!mobileOpen) return;
    openGestureActiveRef.current = true;
    const id = setTimeout(() => {
      openGestureActiveRef.current = false;
    }, 0);
    return () => clearTimeout(id);
  }, [mobileOpen]);

  const drawerRef = useOverlayBehavior<HTMLDivElement>({
    open: mobileOpen,
    onClose: closeMobileSidebar,
  });

  if (!isPlatformAuthenticated || !mobileOpen) return null;

  const navItems = getVisiblePlatformNavItems(perms);
  const sectionMap = new Map<PlatformNavSection, PlatformNavItem[]>();
  for (const item of navItems) {
    if (!sectionMap.has(item.section)) sectionMap.set(item.section, []);
    sectionMap.get(item.section)!.push(item);
  }
  const sections = Array.from(sectionMap.entries()).map(([section, items]) => ({ section, items }));

  return (
    <>
      <div
        role="region"
        aria-label={t('nav.openMenu')}
        className="lg:hidden fixed inset-0 z-sidebar-mobile flex"
      >
        <div
          data-overlay-backdrop
          className={cn('fixed inset-0', OVERLAY_BACKDROP, 'transition-opacity duration-300')}
          onClick={() => {
            if (!openGestureActiveRef.current) {
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
          className="relative w-sidebar-mobile max-w-sheet bg-sidebar h-full shadow-drawer flex flex-col z-elevated border-e border-sidebar-border"
        >
          <div className="flex flex-col justify-between h-full w-full">
            <PlatformSidebarBrand
              isMobile
              collapsed={false}
              reducedMotion={reducedMotion}
              onCloseMobile={closeMobileSidebar}
            />

            <div className="px-3 pt-3 pb-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  closeMobileSidebar();
                  openCommandPalette();
                }}
                className="w-full min-h-11 h-11 justify-between px-3 text-xs text-sidebar-muted-foreground border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-xl transition-all select-none cursor-pointer"
                aria-label={t('platform.nav.searchConsole')}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" aria-hidden />
                  {t('platform.nav.searchConsole')}
                </span>
                <kbd className="inline-flex items-center gap-0.5 rounded border border-sidebar-border bg-card px-1.5 py-0.2 text-3xs font-mono font-bold text-sidebar-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            </div>

            <TooltipProvider delayDuration={150}>
              <PlatformSidebarNav
                sections={sections}
                collapsed={false}
                isMobile
                reducedMotion={reducedMotion}
                closeMobileSidebar={closeMobileSidebar}
              />
            </TooltipProvider>

            <PlatformSidebarFooter
              isMobile
              collapsed={false}
              platformUser={platformUser}
              isSuperUser={isSuperUser}
              onSignOutClick={() => setConfirmSignOutOpen(true)}
              onToggleCollapsed={() => {}}
              onCloseMobile={closeMobileSidebar}
            />
          </div>
        </div>
      </div>

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
