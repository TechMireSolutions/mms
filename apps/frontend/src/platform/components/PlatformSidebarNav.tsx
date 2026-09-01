import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type PlatformNavSection,
  type PlatformNavItem,
} from '@/platform/lib/platformNav';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppTranslationKey } from '@mms/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { isNavPathActive } from '@/lib/config/routes';
import { prefetchRoute } from '@/lib/routing/routePrefetch';

const SECTION_LABEL_KEYS: Record<PlatformNavSection, AppTranslationKey | null> = {
  core: 'platform.nav.sectionOverview',
  admin: 'platform.nav.sectionAdmin',
  ops: 'platform.nav.sectionOps',
  account: null,
};

export interface PlatformSidebarNavProps {
  sections: { section: PlatformNavSection; items: PlatformNavItem[] }[];
  collapsed: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  closeMobileSidebar: () => void;
}

/** Grouped sidebar navigation: collapsed rail shows icons with tooltips, mobile never collapses. */
export function PlatformSidebarNav({
  sections,
  collapsed,
  isMobile,
  reducedMotion,
  closeMobileSidebar,
}: PlatformSidebarNavProps): React.JSX.Element {
  const { t } = useTranslation();
  const location = useLocation();

  return (
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
}