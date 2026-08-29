import React, { useEffect } from 'react';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { PlatformSidebarProvider, usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { PlatformPageShellHeader } from '@/platform/components/PlatformPageShellHeader';
import { PlatformSidebar } from '@/platform/components/PlatformSidebar';
import { PlatformCommandPalette } from '@/platform/components/PlatformCommandPalette';

const CURRENT_YEAR = new Date().getFullYear();

const MAX_W: Record<NonNullable<PlatformPageShellProps['width']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '7xl': 'max-w-7xl',
};

interface PlatformPageShellProps {
  children: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: 'md' | 'lg' | 'xl' | '7xl';
}

/** Shared skip-link wrapper, used by both auth and app branches. */
function PlatformShellFrame({
  dir,
  lang,
  children,
}: {
  dir: string;
  lang: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      dir={dir}
      lang={lang}
      className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-toast focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-xl focus:outline-none text-xs font-bold"
      >
        {t('common.skipToContent')}
      </a>
      {children}
    </div>
  );
}

/** Inner component that reads command palette state from sidebar context. */
function PlatformAuthenticatedShell({
  children,
  maxClass,
  footer,
}: {
  children: React.ReactNode;
  maxClass: string;
  footer: React.ReactNode;
}): React.JSX.Element {
  const { t, dir, language } = useTranslation();
  const { commandPaletteOpen, setCommandPaletteOpen } = usePlatformSidebar();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <PlatformShellFrame dir={dir} lang={language}>
      <PlatformSidebar />
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <PlatformPageShellHeader
          onOpenSearch={() => setCommandPaletteOpen(true)}
          searchOpen={commandPaletteOpen}
        />
        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
          <div className={cn('box-border mx-auto w-full min-w-0', maxClass)}>
            {children}
          </div>
        </main>
        {footer}
      </div>
      <PlatformCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </PlatformShellFrame>
  );
}

/** Shared apex platform page layout — English/LTR only, matching Tenant AppLayout standards. */
export function PlatformPageShell({
  children,
  width = 'lg',
}: PlatformPageShellProps): React.JSX.Element {
  const { t, dir, language } = useTranslation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const maxClass = MAX_W[width] ?? 'max-w-7xl';

  const footer = (
    <footer className="border-t border-border/50 bg-card/20 px-4 py-3 text-center text-xs font-semibold text-muted-foreground select-none sm:px-6 mt-auto">
      {t('theme.footerDefault', {
        year: String(CURRENT_YEAR),
        name: t('entry.productName'),
      })}
    </footer>
  );

  if (isPlatformAuthenticated) {
    return (
      <PlatformSidebarProvider>
        <PlatformAuthenticatedShell maxClass={maxClass} footer={footer}>
          {children}
        </PlatformAuthenticatedShell>
      </PlatformSidebarProvider>
    );
  }

  // Unauthenticated: centered layout (login, setup, forgot-password)
  return (
    <PlatformSidebarProvider>
      <UnauthenticatedShell dir={dir} lang={language} maxClass={maxClass} footer={footer}>
        {children}
      </UnauthenticatedShell>
    </PlatformSidebarProvider>
  );
}

function UnauthenticatedShell({
  dir,
  lang,
  maxClass,
  children,
  footer,
}: {
  dir: string;
  lang: string;
  maxClass: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}): React.JSX.Element {
  const { commandPaletteOpen, setCommandPaletteOpen } = usePlatformSidebar();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div
      dir={dir}
      lang={lang}
      className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden flex-col bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
    >
      <PlatformPageShellHeader
        onOpenSearch={() => setCommandPaletteOpen(true)}
        searchOpen={commandPaletteOpen}
      />
      <main id="main-content" className="flex w-full flex-1 flex-col justify-center pt-20 pb-8 md:py-8">
        <div className={cn('box-border mx-auto w-full min-w-0 px-4 sm:px-6', maxClass)}>
          {children}
        </div>
      </main>
      {footer}
      <PlatformCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

export function PlatformLogoMark({
  size = 'lg',
}: {
  size?: 'sm' | 'lg';
} = {}): React.JSX.Element {
  const { t } = useTranslation();
  const isSm = size === 'sm';
  return (
    <div
      className={
        isSm
          ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-primary/40 p-1 shadow-sm shadow-primary/10 overflow-hidden'
          : 'mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-primary/40 p-2 shadow-xl shadow-primary/15 transition-transform hover:scale-105 select-none overflow-hidden'
      }
      aria-hidden
    >
      <img
        src="/platform-logo.webp"
        alt={t('entry.productName')}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
