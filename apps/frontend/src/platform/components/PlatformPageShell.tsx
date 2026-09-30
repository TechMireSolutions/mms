import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { AppPageShellSkeleton } from '@/components/common';
import { PlatformSidebarProvider, usePlatformSidebar } from '@/platform/lib/PlatformSidebarContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut';
import { AppFooter } from '@/components/ui/AppFooter';
import { PlatformPageShellHeader } from '@/platform/components/PlatformPageShellHeader';
import { PlatformSidebar, PlatformMobileSidebar } from '@/platform/components/PlatformSidebar';
import { PlatformCommandPalette } from '@/platform/components/PlatformCommandPalette';
import { PlatformAiDrawer } from '@/platform/components/intelligence/PlatformAiDrawer';
import { AppShell } from '@/components/common/AppShell';
import { PlatformLiveRegionProvider } from '@/platform/components/common/PlatformLiveRegion';

export { PlatformLogoMark } from './common/PlatformLogoMark';

const MAX_W: Record<NonNullable<PlatformPageShellProps['width']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '7xl': 'w-full max-w-full',
};

interface PlatformPageShellProps {
  children?: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: 'md' | 'lg' | 'xl' | '7xl';
}

/** Registers the Cmd/Ctrl+K and Cmd/Ctrl+J shortcuts. */
function PlatformGlobalShortcuts({ onToggleAi }: { onToggleAi?: () => void }): null {
  const { setCommandPaletteOpen } = usePlatformSidebar();
  useGlobalShortcut('k', () => setCommandPaletteOpen((prev) => !prev));
  useGlobalShortcut('j', () => onToggleAi?.());
  return null;
}

/** Inner component that reads command palette & AI copilot state. */
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
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <AppShell
      dir={dir as "ltr" | "rtl"}
      lang={language}
      sidebar={<PlatformSidebar />}
      mobileSidebar={<PlatformMobileSidebar />}
      topBar={
        <PlatformPageShellHeader
          onOpenSearch={() => setCommandPaletteOpen(true)}
          searchOpen={commandPaletteOpen}
          onOpenAi={() => setAiOpen(true)}
          aiOpen={aiOpen}
        />
      }
      mobileHeader={
        <PlatformPageShellHeader
          onOpenSearch={() => setCommandPaletteOpen(true)}
          searchOpen={commandPaletteOpen}
          onOpenAi={() => setAiOpen(true)}
          aiOpen={aiOpen}
        />
      }
      commandPalette={
        <PlatformCommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenAi={() => setAiOpen(true)}
        />
      }
      sidebarCollapsed={collapsed}
      maxWidthClass={maxClass}
      footer={footer}
    >
      <PlatformGlobalShortcuts onToggleAi={() => setAiOpen((prev) => !prev)} />
      {children}
      <PlatformAiDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </AppShell>
  );
}

/** Shared apex platform page layout — English/LTR only, matching Tenant AppLayout standards. */
export function PlatformPageShell({
  children,
  width = 'lg',
}: PlatformPageShellProps): React.JSX.Element {
  const { dir, language } = useTranslation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const maxClass = MAX_W[width] ?? 'w-full max-w-full';
  const footer = <AppFooter className="mt-auto" />;

  return (
    <PlatformLiveRegionProvider>
      <PlatformSidebarProvider>
        {isPlatformAuthenticated ? (
          <PlatformAuthenticatedShell maxClass={maxClass} footer={footer}>
            {children || (
              <Suspense fallback={<AppPageShellSkeleton />}>
                <Outlet />
              </Suspense>
            )}
          </PlatformAuthenticatedShell>
        ) : (
          <UnauthenticatedShell dir={dir} lang={language} maxClass={maxClass} footer={footer}>
            {children || (
              <Suspense fallback={<AppPageShellSkeleton />}>
                <Outlet />
              </Suspense>
            )}
          </UnauthenticatedShell>
        )}
      </PlatformSidebarProvider>
    </PlatformLiveRegionProvider>
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

  return (
    <AppShell
      dir={dir as "ltr" | "rtl"}
      lang={lang}
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
      <PlatformGlobalShortcuts />
      {children}
    </AppShell>
  );
}
