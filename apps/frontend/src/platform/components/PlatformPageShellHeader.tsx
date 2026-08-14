import React from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { Button } from '@/components/ui/button';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';
import { PlatformHeaderBrand } from '@/platform/components/header/PlatformHeaderBrand';
import { PlatformHeaderUserNav } from '@/platform/components/header/PlatformHeaderUserNav';

export interface PlatformPageShellHeaderProps {
  onOpenSearch?: () => void;
}

export function PlatformPageShellHeader({ onOpenSearch }: PlatformPageShellHeaderProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const perms = usePlatformPermissions();
  const { isPlatformAuthenticated } = perms;
  const { openMobileSidebar } = usePlatformSidebar();

  if (!isPlatformAuthenticated) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/85 backdrop-blur-xl shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openMobileSidebar}
            aria-label={t('nav.openMenu')}
            className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile Brand Logo */}
          <div className="md:hidden">
            <PlatformHeaderBrand />
          </div>

          {/* Desktop Operational Badge */}
          <span className={cn(SEMANTIC_BADGE.success, 'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold')}>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t('platform.statusOperational')}
          </span>
        </div>

        {/* Right Side Header User Actions */}
        <PlatformHeaderUserNav onOpenSearch={onOpenSearch} className="ms-auto" />
      </div>
    </header>
  );
}
