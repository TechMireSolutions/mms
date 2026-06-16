import { Link, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import usePermissions from "@/hooks/usePermissions";
import { useTenant } from "@/lib/contexts/TenantContext";
import { ROUTES } from "@/lib/config/routes";
import useTranslation from "@/hooks/useTranslation";

/**
 * PageNotFound component displayed when a route is not matched.
 */
export default function PageNotFound(): React.JSX.Element {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { can } = usePermissions();
  const { isApex } = useTenant();
  const { t } = useTranslation();
  const pageName = location.pathname;

  const primaryLink = isAuthenticated
    ? ROUTES.home
    : isApex
      ? ROUTES.login
      : ROUTES.login;

  const primaryLabel = isAuthenticated
    ? t("page.notFound.goDashboard")
    : isApex
      ? t("page.notFound.goSignIn")
      : t("page.notFound.goSignIn");

  return (
    <div dir={isApex ? "ltr" : undefined} className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
            <div className="h-0.5 w-16 bg-border mx-auto" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-foreground">{t("page.notFound.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("page.notFound.message", { path: pageName })}
            </p>
          </div>

          {isAuthenticated && can("users.manage") && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border text-left">
              <p className="text-sm font-medium text-foreground">{t("page.notFound.adminNote")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {t("page.notFound.adminNoteBody")}
              </p>
            </div>
          )}

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isApex ? (
              <Link
                to={ROUTES.home}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t("page.notFound.goHome")}
              </Link>
            ) : null}
            <Link
              to={primaryLink}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              {primaryLabel}
            </Link>
            {isAuthenticated && (
              <Link
                to={ROUTES.settingsSection("global")}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:underline"
              >
                {t("page.notFound.openSettings")}
              </Link>
            )}
            {!isAuthenticated && isApex ? (
              <Link
                to={ROUTES.onboarding}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:underline"
              >
                {t("auth.createMadrasa")}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
