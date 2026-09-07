import React from 'react';
import { translateAppParams } from '@mms/shared';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RootErrorBoundary({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {translateAppParams('errors.boundary.title', 'en')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {translateAppParams('errors.boundary.description', 'en')}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
