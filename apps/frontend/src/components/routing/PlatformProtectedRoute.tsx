import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";

/** Requires platform super-user session on the apex domain. */
export default function PlatformProtectedRoute(): React.JSX.Element {
  const { isPlatformAuthenticated, isLoadingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isLoadingPlatformAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
