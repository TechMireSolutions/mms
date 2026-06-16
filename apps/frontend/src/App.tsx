import React, { useEffect, Suspense } from "react";
import { applyAppTheme } from "./lib/brandingTheme";
import { SETTINGS_PREVIEW_EVENT } from "./lib/settingsPreview";
import { BrandingPaletteProvider } from "./lib/BrandingPaletteContext";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ContactConfigProvider } from "./lib/ContactConfigContext";
import RouterBridge from '@/components/routing/RouterBridge';
import HostRoutes from '@/components/routing/HostRoutes';
import { TenantProvider } from '@/lib/TenantContext';
import useTranslation from '@/hooks/useTranslation';

const LoadingFallback = (): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center justify-center min-h-[50vh] w-full"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t('common.loading')}</span>
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" aria-hidden="true" />
    </div>
  );
};

const AuthenticatedApp = (): React.JSX.Element | null => {
  const { isLoadingAuth, authError, authChecked } = useAuth();

  // Only block the app on the initial auth check — not during login/onboard submit
  if (isLoadingAuth && !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-display text-xl font-bold">م</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <>
      <RouterBridge />
      <Suspense fallback={<LoadingFallback />}>
        <HostRoutes />
      </Suspense>
    </>
  );
};

/**
 * Root Application component. Wraps the main routes in authentication,
 * caching providers, router wrappers, and toast overlays.
 */
function App(): React.JSX.Element {
  useEffect(() => {
    applyAppTheme();

    const onThemeUpdate = () => applyAppTheme();
    window.addEventListener("local-database-update", onThemeUpdate);
    window.addEventListener(SETTINGS_PREVIEW_EVENT, onThemeUpdate);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyAppTheme();
    mediaQuery.addEventListener("change", listener);

    return () => {
      window.removeEventListener("local-database-update", onThemeUpdate);
      window.removeEventListener(SETTINGS_PREVIEW_EVENT, onThemeUpdate);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <BrandingPaletteProvider>
            <TenantProvider>
              <ContactConfigProvider>
                <AuthenticatedApp />
              </ContactConfigProvider>
            </TenantProvider>
          </BrandingPaletteProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
