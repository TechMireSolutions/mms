import React, { useEffect, Suspense } from "react";
import { applyAppTheme } from "./lib/brandingTheme";
import { SETTINGS_PREVIEW_EVENT } from "./lib/settingsPreview";
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlatformAuth } from '@/lib/contexts/PlatformAuthContext';
import { useTenant } from '@/lib/contexts/TenantContext';
import UserNotRegisteredError from '@/components/routing/UserNotRegisteredError';
import RouterBridge from '@/components/routing/RouterBridge';
import HostRoutes from '@/components/routing/HostRoutes';
import RouteLoadingFallback from '@/components/routing/RouteLoadingFallback';
import { AppProviders } from '@/providers/AppProviders';

const AuthenticatedApp = (): React.JSX.Element | null => {
  const { isApex } = useTenant();
  const { isLoadingPlatformAuth, platformAuthChecked } = usePlatformAuth();
  const { isLoadingAuth, authError, authChecked } = useAuth();

  const bootLoading = isApex
    ? !platformAuthChecked || isLoadingPlatformAuth
    : isLoadingAuth && !authChecked;

  if (bootLoading) {
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
      <Suspense fallback={<RouteLoadingFallback />}>
        <HostRoutes />
      </Suspense>
    </>
  );
};

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
    <AppProviders>
      <AuthenticatedApp />
    </AppProviders>
  );
}

export default App;
