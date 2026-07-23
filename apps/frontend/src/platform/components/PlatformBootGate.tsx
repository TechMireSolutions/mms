import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { ROUTES } from '@/lib/config/routes';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import ApexPageNotFound from '@/platform/components/ApexPageNotFound';

interface PlatformBootGateProps {
  /** When true, unauthenticated users are redirected to apex home. */
  requireAuth?: boolean;
  requireSuperUser?: boolean;
}

/**
 * Unified platform session boot gate — replaces duplicate checks in ApexHome.
 */
export default function PlatformBootGate({
  requireAuth = true,
  requireSuperUser = false,
}: PlatformBootGateProps): React.JSX.Element {
  const {
    platformUser,
    isPlatformAuthenticated,
    isCheckingPlatformAuth,
    platformAuthChecked,
  } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <RouteStatusFallback fullScreen />;
  }

  if (requireAuth && !isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (requireSuperUser && platformUser?.role !== 'super_user') {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}

/** Catch-all: unauthenticated users on unknown URLs return to sign-in. */
export function PlatformFallbackRoute(): React.JSX.Element {
  const location = useLocation();
  const { isPlatformAuthenticated, isCheckingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <RouteStatusFallback fullScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace state={{ from: location.pathname }} />;
  }

  return <ApexPageNotFound />;
}

