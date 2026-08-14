import React, { useState, useEffect } from 'react';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { PlatformSidebarProvider } from '@/platform/lib/PlatformSidebarContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { PlatformPageShellHeader } from '@/platform/components/PlatformPageShellHeader';
import { PlatformSidebar } from '@/platform/components/PlatformSidebar';
import { PlatformCommandPalette } from '@/platform/components/PlatformCommandPalette';

interface PlatformPageShellProps {
  children: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: 'md' | 'lg' | 'xl' | '7xl';
}

/** Shared apex platform page layout — English/LTR only, matching Tenant AppLayout standards. */
export function PlatformPageShell({
  children,
  width = 'lg',
}: PlatformPageShellProps): React.JSX.Element {
  const { t } = useTranslation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const maxClass =
    width === '7xl'
      ? 'max-w-7xl'
      : width === 'md'
        ? 'max-w-md'
        : width === 'lg'
          ? 'max-w-lg'
          : width === 'xl'
            ? 'max-w-xl'
            : 'max-w-7xl';

  if (isPlatformAuthenticated) {
    return (
      <PlatformSidebarProvider>
        <div
          dir="ltr"
          lang="en"
          className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
        >
          <PlatformSidebar />
          <div className="flex flex-1 flex-col min-w-0 min-h-screen">
            <PlatformPageShellHeader onOpenSearch={() => setSearchOpen(true)} />
            <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
              <div className={cn('box-border mx-auto w-full min-w-0', maxClass)}>
                {children}
              </div>
            </main>
            <footer className="border-t border-border/50 bg-card/20 px-4 py-3 text-center text-xs font-semibold text-muted-foreground select-none sm:px-6 mt-auto">
              {t('theme.footerDefault', {
                year: new Date().getFullYear(),
                name: t('entry.productName'),
              })}
            </footer>
          </div>
        </div>
        <PlatformCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </PlatformSidebarProvider>
    );
  }

  return (
    <div
      dir="ltr"
      lang="en"
      className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden flex-col bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
    >
      <PlatformPageShellHeader onOpenSearch={() => setSearchOpen(true)} />

      <main id="main-content" className="flex w-full flex-1 flex-col justify-center pt-20 pb-8 md:py-8">
        <div className={cn('box-border mx-auto w-full min-w-0 px-4 sm:px-6', maxClass)}>
          {children}
        </div>
      </main>
      <footer className="border-t border-border/50 bg-card/20 px-4 py-3 text-center text-xs font-semibold text-muted-foreground select-none sm:px-6 mt-auto">
        {t('theme.footerDefault', {
          year: new Date().getFullYear(),
          name: t('entry.productName'),
        })}
      </footer>
      <PlatformCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export function PlatformLogoMark({
  size = 'lg',
}: {
  size?: 'sm' | 'lg';
} = {}): React.JSX.Element {
  const isSm = size === 'sm';
  return (
    <div
      className={
        isSm
          ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary shadow-sm shadow-primary/20 ring-1 ring-white/20'
          : 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-primary/90 to-secondary shadow-lg shadow-primary/25 ring-1 ring-white/25 transition-transform hover:scale-105 select-none'
      }
      aria-hidden
    >
      <span className={isSm ? 'font-display text-sm font-black text-primary-foreground' : 'font-display text-2xl font-black text-primary-foreground'}>
        م
      </span>
    </div>
  );
}
