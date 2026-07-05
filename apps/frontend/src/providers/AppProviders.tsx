import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { BrandingPaletteProvider } from '@/lib/contexts/BrandingPaletteContext';
import { PlatformAuthProvider } from '@/platform/lib/PlatformAuthContext';
import { TenantProvider } from '@/lib/contexts/TenantContext';
import { TranslationProvider } from '@/lib/contexts/TranslationContext';
import { ApexBootPrefetch } from '@/platform/components/ApexBootPrefetch';
import TenantScopedProviders from '@/providers/TenantScopedProviders';
import { queryClientInstance } from '@/lib/queryClient';
import RootErrorBoundary from '@/components/routing/RootErrorBoundary';
import QueryDevtools from '@/components/dev/QueryDevtools';
import { Toaster } from '@/components/ui/toaster';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/** Root provider composition — order must not change without reviewing auth/tenant boot. */
export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <BrandingPaletteProvider>
              <TenantProvider>
                <TranslationProvider>
                  <PlatformAuthProvider>
                    <ApexBootPrefetch />
                    <TenantScopedProviders>{children}</TenantScopedProviders>
                  </PlatformAuthProvider>
                </TranslationProvider>
              </TenantProvider>
            </BrandingPaletteProvider>
          </Router>
          <Toaster />
          <QueryDevtools />
        </QueryClientProvider>
      </AuthProvider>
    </RootErrorBoundary>
  );
}
