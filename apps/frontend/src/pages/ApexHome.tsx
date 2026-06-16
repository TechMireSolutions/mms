import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import PlatformSignIn from "@/pages/auth/PlatformSignIn";
import PlatformConsole from "@/pages/PlatformConsole";

/** Apex home: platform sign-in or authenticated console. */
export default function ApexHome(): React.JSX.Element {
  const { isPlatformAuthenticated, platformAuthChecked, isLoadingPlatformAuth } = usePlatformAuth();

  if (!platformAuthChecked || isLoadingPlatformAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!isPlatformAuthenticated) {
    return <PlatformSignIn />;
  }

  return <PlatformConsole />;
}
