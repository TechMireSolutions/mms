import React, { useEffect, Suspense } from "react";
import { applyAppTheme } from "./lib/brandingTheme";
import { SETTINGS_PREVIEW_EVENT } from "./lib/settingsPreview";
import { useAuth } from '@/lib/contexts/AuthContext';
import { useIsTenantHost } from '@/hooks/useIsTenantHost';
import UserNotRegisteredError from '@/components/routing/UserNotRegisteredError';
import RouterBridge from '@/components/routing/RouterBridge';
import HostRoutes from '@/components/routing/HostRoutes';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { AppProviders } from '@/providers/AppProviders';

const AuthenticatedApp = (): React.JSX.Element | null => {
  const isTenantHost = useIsTenantHost();
  const { isLoadingAuth, authError, authChecked } = useAuth();

  if (isTenantHost) {
    const bootLoading = isLoadingAuth && !authChecked;
    if (bootLoading) {
      return <RouteStatusFallback fullScreen />;
    }

    if (authError?.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <>
      <RouterBridge />
      <Suspense fallback={<RouteStatusFallback />}>
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
