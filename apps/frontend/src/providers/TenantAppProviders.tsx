import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { BrandingPaletteProvider } from '@/lib/contexts/BrandingPaletteContext';
import { TenantProvider } from '@/lib/contexts/TenantContext';
import { TranslationProvider } from '@/lib/contexts/TranslationContext';
import { ContactConfigProvider } from '@/lib/contexts/ContactConfigContext';
import { queryClientInstance } from '@/lib/queryClient';
import RootErrorBoundary from '@/components/routing/RootErrorBoundary';
import QueryDevtools from '@/components/dev/QueryDevtools';
import { Toaster } from '@/components/ui/toaster';

export interface TenantAppProvidersProps {
  children: React.ReactNode;
}

/** Root provider composition for Tenant (Madrasa) subdomain scope. */
export function TenantAppProviders({ children }: TenantAppProvidersProps): React.JSX.Element {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <BrandingPaletteProvider>
            <TenantProvider>
              <TranslationProvider>
                <AuthProvider>
                  <ContactConfigProvider>
                    {children}
                  </ContactConfigProvider>
                </AuthProvider>
              </TranslationProvider>
            </TenantProvider>
          </BrandingPaletteProvider>
        </Router>
        <Toaster />
        <QueryDevtools />
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
