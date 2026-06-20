import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/lib/contexts/PlatformAuthContext';
import { ROUTES } from '@/lib/config/routes';
import PlatformLoadingScreen from '@/components/platform/PlatformLoadingScreen';

interface PlatformBootGateProps {
  /** When true, unauthenticated users are redirected to apex home. */
  requireAuth?: boolean;
}

/**
 * Unified platform session boot gate — replaces duplicate checks in ApexHome.
 */
export default function PlatformBootGate({
  requireAuth = true,
}: PlatformBootGateProps): React.JSX.Element {
  const { isPlatformAuthenticated, isCheckingPlatformAuth, platformAuthChecked } = usePlatformAuth();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (requireAuth && !isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
