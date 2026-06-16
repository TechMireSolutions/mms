import React from 'react';
import useTranslation from '@/hooks/useTranslation';

/** Accessible Suspense fallback for lazy-loaded routes. */
export default function RouteLoadingFallback(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center justify-center min-h-[50vh] w-full"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t('common.loading')}</span>
      <div
        className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"
        aria-hidden="true"
      />
    </div>
  );
}
