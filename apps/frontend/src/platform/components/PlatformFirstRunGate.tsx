import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformSetupStatus } from '@/platform/hooks/usePlatformSetupStatus';
import { ROUTES } from '@/lib/config/routes';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';

/**
 * When the platform has no users yet, force first-run super-user setup on `/`.
 * Blocks alternate apex auth entry (e.g. forgot-password) until setup completes.
 */
export function PlatformFirstRunGate(): React.JSX.Element {
  const { isPlatformAuthenticated, platformAuthChecked, isCheckingPlatformAuth } = usePlatformAuth();
  const { setupStatus, isLoadingSetup } = usePlatformSetupStatus();

  if (!platformAuthChecked || isCheckingPlatformAuth || isLoadingSetup) {
    return <RouteStatusFallback fullScreen />;
  }

  if (!isPlatformAuthenticated && setupStatus?.needsSetup) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
