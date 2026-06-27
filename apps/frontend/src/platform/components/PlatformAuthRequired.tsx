import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { ROUTES } from '@/lib/config/routes';
import { PlatformLoadingScreen } from '@/platform/components/PlatformLoadingScreen';
import ApexPageNotFound from '@/platform/components/ApexPageNotFound';

/**
 * Redirects unauthenticated users away from non-entry platform routes to apex home (sign-in).
 */
export default function PlatformAuthRequired({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const location = useLocation();
  const { isPlatformAuthenticated, isCheckingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** Catch-all: unauthenticated users on unknown URLs return to sign-in. */
export function PlatformFallbackRoute(): React.JSX.Element {
  const location = useLocation();
  const { isPlatformAuthenticated, isCheckingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace state={{ from: location.pathname }} />;
  }

  return <ApexPageNotFound />;
}
