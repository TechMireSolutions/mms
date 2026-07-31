import React from 'react';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { cn } from '@/lib/utils';
import { PlatformPageShellHeader } from '@/platform/components/PlatformPageShellHeader';

interface PlatformPageShellProps {
  children: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: 'md' | 'lg' | 'xl' | '7xl';
}

/** Shared apex platform page layout — English/LTR only. */
export function PlatformPageShell({
  children,
  width = 'lg',
}: PlatformPageShellProps): React.JSX.Element {
  const { isPlatformAuthenticated } = usePlatformAuth();

  const maxClass = isPlatformAuthenticated
    ? 'max-w-7xl'
    : width === 'md'
      ? 'max-w-md'
      : width === 'lg'
        ? 'max-w-lg'
        : width === 'xl'
          ? 'max-w-xl'
          : 'max-w-7xl';

  return (
    <div
      dir="ltr"
      lang="en"
      className="box-border flex min-h-screen w-full max-w-full overflow-x-hidden flex-col bg-background selection:bg-primary/10 selection:text-primary"
    >
      <PlatformPageShellHeader />

      <main id="main-content" className="flex w-full flex-1 flex-col justify-center py-8">
        <div className={cn('box-border mx-auto w-full min-w-0 px-4 sm:px-6', maxClass)}>
          {children}
        </div>
      </main>
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
          ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary shadow-sm shadow-primary/20'
          : 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary shadow-md shadow-primary/20'
      }
      aria-hidden
    >
      <span className={isSm ? 'font-display text-sm font-black text-white' : 'font-display text-2xl font-black text-white'}>
        م
      </span>
    </div>
  );
}
