import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthPageFrame } from '@/components/entry/AuthPageShell';

/** Skeleton shell shown while tenant branding loads — matches auth card layout. */
export default function AuthLoadingShell(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <AuthPageFrame>
      <div
        className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-xl shadow-black/[0.04] backdrop-blur-xl"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
        <div className="border-b border-border/50 bg-muted/10 px-6 py-6 text-center sm:px-8">
          <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-muted" aria-hidden />
          <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" aria-hidden />
          <div className="mx-auto mt-2 h-3 w-48 animate-pulse rounded bg-muted/70" aria-hidden />
        </div>
        <div className="space-y-3 px-6 py-6 sm:px-8 sm:py-7">
          <div className="h-11 animate-pulse rounded-lg bg-muted" aria-hidden />
          <div className="h-11 animate-pulse rounded-lg bg-muted" aria-hidden />
          <div className="h-11 animate-pulse rounded-xl bg-muted/80" aria-hidden />
        </div>
        <span className="sr-only">{t('auth.loadingWorkspace')}</span>
      </div>
    </AuthPageFrame>
  );
}
