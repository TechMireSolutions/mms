import React from "react";
import { Link, useLocation } from "react-router-dom";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/hooks/useTranslation";

/** 404 page for platform apex routes only — no tenant auth/RBAC coupling. */
export default function ApexPageNotFound(): React.JSX.Element {
  const location = useLocation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const { t } = useTranslation();

  const primaryLabel = isPlatformAuthenticated
    ? t("page.notFound.goDashboard")
    : t("page.notFound.goHome");

  return (
    <main
      id="main-content"
      dir="ltr"
      className="min-h-screen flex items-center justify-center p-6 bg-background"
    >
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
            <div className="h-0.5 w-16 bg-border mx-auto" aria-hidden />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-foreground">{t("page.notFound.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("page.notFound.message", { path: location.pathname })}
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              {primaryLabel}
            </Link>
            {isPlatformAuthenticated ? (
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
    </main>
  );
}
