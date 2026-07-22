import React, { Suspense, lazy } from "react";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformSetupStatus } from "@/platform/hooks/usePlatformSetupStatus";
import { PlatformLoadingScreen } from "@/platform/components/PlatformLoadingScreen";
import { useTranslation } from "@/hooks/useTranslation";

const PlatformSignIn = lazy(() => import("@/platform/pages/auth/PlatformSignIn"));
const PlatformSetup = lazy(() => import("@/platform/pages/auth/PlatformSetup"));
const PlatformConsole = lazy(() => import("@/platform/pages/PlatformConsole"));

/** Apex home: first-run setup, platform sign-in, or authenticated console. */
export default function ApexHome(): React.JSX.Element {
  const { t } = useTranslation();
  const { isPlatformAuthenticated, platformAuthChecked, isCheckingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup, isError, refetch } = usePlatformSetupStatus();

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

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-background">
        <h1 className="text-xl font-semibold text-destructive">
          {t("errors.boundary.title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("errors.boundary.description")}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all cursor-pointer"
        >
          {t("errors.module.retry")}
        </button>
      </div>
    );
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
