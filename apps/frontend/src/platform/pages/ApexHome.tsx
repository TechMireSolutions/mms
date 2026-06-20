import React, { Suspense, lazy } from "react";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { usePlatformSetupStatus } from "@/hooks/usePlatformSetupStatus";
import PlatformLoadingScreen from "@/components/platform/PlatformLoadingScreen";

const PlatformSignIn = lazy(() => import("@/pages/auth/PlatformSignIn"));
const PlatformSetup = lazy(() => import("@/pages/auth/PlatformSetup"));
const PlatformConsole = lazy(() => import("@/pages/PlatformConsole"));

/** Apex home: first-run setup, platform sign-in, or authenticated console. */
export default function ApexHome(): React.JSX.Element {
  const { isPlatformAuthenticated, platformAuthChecked, isCheckingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup } = usePlatformSetupStatus();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (isPlatformAuthenticated) {
    return (
      <Suspense fallback={<PlatformLoadingScreen />}>
        <PlatformConsole />
      </Suspense>
    );
  }

  if (isLoadingSetup) {
    return <PlatformLoadingScreen />;
  }

  if (setupStatus?.needsSetup) {
    return (
      <Suspense fallback={<PlatformLoadingScreen />}>
        <PlatformSetup smtpConfigured={setupStatus.smtpConfigured} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PlatformLoadingScreen />}>
      <PlatformSignIn />
    </Suspense>
  );
}
