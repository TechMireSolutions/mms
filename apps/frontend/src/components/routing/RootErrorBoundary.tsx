import React from 'react';
import { translateAppParams } from '@mms/shared';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ErrorState from '@/components/ui/ErrorState';

export default function RootErrorBoundary({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <ErrorState
            title={translateAppParams('errors.boundary.title', 'en')}
            description={translateAppParams('errors.boundary.description', 'en')}
            onRetry={() => window.location.reload()}
          />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
