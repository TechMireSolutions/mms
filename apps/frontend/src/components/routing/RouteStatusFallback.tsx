import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface RouteStatusFallbackProps {
  /** Use full viewport height (boot gates) vs in-route Suspense fallback. */
  fullScreen?: boolean;
}

/** Accessible loading state for route boot gates and redirects. */
export default function RouteStatusFallback({
  fullScreen = false,
}: RouteStatusFallbackProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-center bg-background ${fullScreen ? 'min-h-screen' : 'min-h-[50vh] w-full'}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
