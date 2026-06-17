import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";
import PlatformLoadingScreen from "@/components/platform/PlatformLoadingScreen";

/** Requires platform super-user session on the apex domain. */
export default function PlatformProtectedRoute(): React.JSX.Element {
  const { isPlatformAuthenticated, isLoadingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isLoadingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
