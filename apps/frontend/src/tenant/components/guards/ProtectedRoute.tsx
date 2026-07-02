import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { requiresTwoFactor } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { DEFAULT_AUTH_REDIRECT, ROUTES } from "@/lib/config/routes";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { is2FAPending, is2FAVerified } from "@/lib/twoFactor";

/**
 * Requires an authenticated session. Redirects guests to login with return path.
 * When global 2FA is required, blocks access until verification completes.
 */
export default function ProtectedRoute(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const settings = useGlobalSettings();
  const location = useLocation();

  if (!isAuthenticated) {
    if (is2FAPending()) {
      return <Navigate to={ROUTES.twoFactor} replace state={{ from: location.pathname }} />;
    }
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location.pathname !== ROUTES.login ? location.pathname : DEFAULT_AUTH_REDIRECT }}
      />
    );
  }

  if (requiresTwoFactor(settings, user) && !is2FAVerified()) {
    return (
      <Navigate
        to={ROUTES.twoFactor}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
