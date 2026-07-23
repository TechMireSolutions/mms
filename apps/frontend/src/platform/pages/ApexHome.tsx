import React, { Suspense, lazy } from "react";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformSetupStatus } from "@/platform/hooks/usePlatformSetupStatus";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { useTranslation } from "@/hooks/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";

const PlatformSignIn = lazy(() => import("@/platform/pages/auth/PlatformSignIn"));
const PlatformSetup = lazy(() => import("@/platform/pages/auth/PlatformSetup"));
const PlatformConsole = lazy(() => import("@/platform/pages/PlatformConsole"));

/** Apex home: first-run setup, platform sign-in, or authenticated console. */
export default function ApexHome(): React.JSX.Element {
  const { t } = useTranslation();
  const { isPlatformAuthenticated, platformAuthChecked, isCheckingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup, isError, refetch } = usePlatformSetupStatus();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <RouteStatusFallback fullScreen />;
  }

  if (isPlatformAuthenticated) {
    return (
      <Suspense fallback={<RouteStatusFallback fullScreen />}>
        <PlatformConsole />
      </Suspense>
    );
  }

  if (isLoadingSetup) {
    return <RouteStatusFallback fullScreen />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <ErrorState
          title={t("errors.boundary.title")}
          description={t("errors.boundary.description")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (setupStatus?.needsSetup) {
    return (
      <Suspense fallback={<RouteStatusFallback fullScreen />}>
        <PlatformSetup smtpConfigured={setupStatus.smtpConfigured} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteStatusFallback fullScreen />}>
      <PlatformSignIn />
    </Suspense>
  );
}
