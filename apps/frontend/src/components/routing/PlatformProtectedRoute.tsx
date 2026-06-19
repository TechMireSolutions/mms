import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";
import PlatformLoadingScreen from "@/components/platform/PlatformLoadingScreen";

/** Requires platform super-user session on the apex domain. */
export default function PlatformProtectedRoute(): React.JSX.Element {
  const { isPlatformAuthenticated, isCheckingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
