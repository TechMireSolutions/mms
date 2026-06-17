import React from "react";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { usePlatformSetupStatus } from "@/hooks/usePlatformSetupStatus";
import PlatformLoadingScreen from "@/components/platform/PlatformLoadingScreen";
import PlatformSignIn from "@/pages/auth/PlatformSignIn";
import PlatformSetup from "@/pages/auth/PlatformSetup";
import PlatformConsole from "@/pages/PlatformConsole";

/** Apex home: first-run setup, platform sign-in, or authenticated console. */
export default function ApexHome(): React.JSX.Element {
  const { isPlatformAuthenticated, platformAuthChecked, isLoadingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup } = usePlatformSetupStatus();

  if (!platformAuthChecked || isLoadingPlatformAuth || isLoadingSetup) {
    return <PlatformLoadingScreen />;
  }

  if (setupStatus?.needsSetup) {
    return <PlatformSetup smtpConfigured={setupStatus.smtpConfigured} />;
  }

  if (!isPlatformAuthenticated) {
    return <PlatformSignIn />;
  }

  return <PlatformConsole />;
}
