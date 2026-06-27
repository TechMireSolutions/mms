import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { PlatformAuthProvider } from '@/platform/lib/PlatformAuthContext';
import { ApexBootPrefetch } from '@/platform/components/ApexBootPrefetch';
import { queryClientInstance } from '@/lib/query-client';
import RootErrorBoundary from '@/components/routing/RootErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

export interface PlatformAppProvidersProps {
  children: React.ReactNode;
}

/** Root provider composition for Platform (Apex) host scope. */
export function PlatformAppProviders({ children }: PlatformAppProvidersProps): React.JSX.Element {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <PlatformAuthProvider>
            <ApexBootPrefetch />
            {children}
          </PlatformAuthProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
