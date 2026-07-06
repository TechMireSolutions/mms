import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { ROUTES } from '@/lib/config/routes';
import { PlatformLoadingScreen } from '@/platform/components/PlatformLoadingScreen';

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
    return <PlatformLoadingScreen />;
  }

  if (requireAuth && !isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (requireSuperUser && platformUser?.role !== 'super_user') {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
