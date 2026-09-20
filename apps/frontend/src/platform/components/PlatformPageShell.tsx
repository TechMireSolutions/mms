import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { ModuleScaffoldSkeleton } from '@/components/common/ModuleScaffold';
import { PlatformSidebarProvider, usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut';
import { AppFooter } from '@/components/ui/AppFooter';
import { SkipToContentLink } from '@/components/ui/SkipToContentLink';
import { PlatformPageShellHeader } from '@/platform/components/PlatformPageShellHeader';
import { PlatformSidebar } from '@/platform/components/PlatformSidebar';
import { PlatformCommandPalette } from '@/platform/components/PlatformCommandPalette';
import { AppShell } from '@/components/common/AppShell';

const MAX_W: Record<NonNullable<PlatformPageShellProps['width']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '7xl': 'max-w-7xl',
};

interface PlatformPageShellProps {
  children?: React.ReactNode;
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
  return (
    <div
      dir={dir}
      lang={lang}
      className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
    >
      <SkipToContentLink />
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
  const { dir, language } = useTranslation();
  const { commandPaletteOpen, setCommandPaletteOpen, collapsed } = usePlatformSidebar();

  useGlobalShortcut('k', () => setCommandPaletteOpen((prev) => !prev));

  return (
    <div dir={dir} lang={language}>
      <AppShell
        sidebar={<PlatformSidebar />}
        topBar={
          <PlatformPageShellHeader
            onOpenSearch={() => setCommandPaletteOpen(true)}
            searchOpen={commandPaletteOpen}
          />
        }
        mobileHeader={
          <PlatformPageShellHeader
            onOpenSearch={() => setCommandPaletteOpen(true)}
            searchOpen={commandPaletteOpen}
          />
        }
        commandPalette={
          <PlatformCommandPalette
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        }
        sidebarCollapsed={collapsed}
        maxWidthClass={maxClass}
        footer={footer}
      >
        {children}
      </AppShell>
    </div>
  );
}

/** Shared apex platform page layout — English/LTR only, matching Tenant AppLayout standards. */
export function PlatformPageShell({
  children,
  width = 'lg',
}: PlatformPageShellProps): React.JSX.Element {
  const { dir, language } = useTranslation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const maxClass = MAX_W[width] ?? 'max-w-7xl';

  const footer = <AppFooter className="mt-auto" />;

  if (isPlatformAuthenticated) {
    return (
      <PlatformSidebarProvider>
        <PlatformAuthenticatedShell maxClass={maxClass} footer={footer}>
          {children || (
            <Suspense fallback={<ModuleScaffoldSkeleton />}>
              <Outlet />
            </Suspense>
          )}
        </PlatformAuthenticatedShell>
      </PlatformSidebarProvider>
    );
  }

  // Unauthenticated: centered layout (login, setup, forgot-password)
  return (
    <PlatformSidebarProvider>
      <UnauthenticatedShell dir={dir} lang={language} maxClass={maxClass} footer={footer}>
        {children || (
          <Suspense fallback={<ModuleScaffoldSkeleton />}>
            <Outlet />
          </Suspense>
        )}
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

  useGlobalShortcut('k', () => setCommandPaletteOpen((prev) => !prev));

  return (
    <div dir={dir} lang={lang}>
      <AppShell
        topBar={
          <PlatformPageShellHeader
            onOpenSearch={() => setCommandPaletteOpen(true)}
            searchOpen={commandPaletteOpen}
          />
        }
        mobileHeader={
          <PlatformPageShellHeader
            onOpenSearch={() => setCommandPaletteOpen(true)}
            searchOpen={commandPaletteOpen}
          />
        }
        commandPalette={
          <PlatformCommandPalette
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        }
        maxWidthClass={maxClass}
        footer={footer}
      >
        {children}
      </AppShell>
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
