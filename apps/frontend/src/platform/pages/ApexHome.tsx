import React from "react";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformSetupStatus } from "@/platform/hooks/usePlatformSetupStatus";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { AuthPageFrame } from "@/components/entry/AuthPageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";
import PlatformSignIn from "@/platform/pages/auth/PlatformSignIn";
import PlatformSetup from "@/platform/pages/auth/PlatformSetup";
import PlatformConsole from "@/platform/pages/PlatformConsole";

/**
 * Apex home decision tree:
 * 1. Wait for platform session probe + setup status
 * 2. Authenticated → console
 * 3. No platform users (`needsSetup`) → force create first super-user
 * 4. Otherwise → platform sign-in
 */
export default function ApexHome(): React.JSX.Element {
  const { t } = useTranslation();
  const { isPlatformAuthenticated, platformAuthChecked, isCheckingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup, isError, refetch } = usePlatformSetupStatus();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <RouteStatusFallback fullScreen />;
  }

  // Prefer session over stale needsSetup after OTP verify (invalidate is async).
  if (isPlatformAuthenticated) {
    return <PlatformConsole />;
  }

  if (isLoadingSetup) {
    return <RouteStatusFallback fullScreen />;
  }

  if (isError) {
    return (
      <AuthPageFrame dir="ltr">
        <div className="relative z-10 w-full max-w-md">
          <ErrorState
            title={t("platform.loadFailed")}
            description={t("platform.loadFailedHint")}
            onRetry={() => void refetch()}
          />
        </div>
      </AuthPageFrame>
    );
  }

  if (setupStatus?.needsSetup) {
    return <PlatformSetup smtpConfigured={setupStatus.smtpConfigured} />;
  }

  return <PlatformSignIn />;
}
