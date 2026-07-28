import React from "react";
import { Link, useLocation } from "react-router-dom";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";
import { Button } from "@/components/ui/button";

/** 404 page for platform apex routes only — no tenant auth/RBAC coupling. */
export default function ApexPageNotFound(): React.JSX.Element {
  const location = useLocation();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const { t } = useTranslation();

  const primaryLabel = isPlatformAuthenticated
    ? t("page.notFound.goDashboard")
    : t("page.notFound.goHome");

  return (
    <AuthPageFrame>
      <AuthCardShell
        className="max-w-md"
        header={
          <div className="space-y-3">
            <p className="font-display text-6xl font-light text-muted-foreground/35" aria-hidden>
              404
            </p>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("page.notFound.title")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("page.notFound.message", { path: location.pathname })}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 flex-1 rounded-xl font-semibold">
            <Link to={ROUTES.home}>{primaryLabel}</Link>
          </Button>
          {isPlatformAuthenticated ? (
            <Button asChild variant="outline" size="lg" className="h-11 flex-1 rounded-xl">
              <Link to={ROUTES.onboarding}>{t("auth.createMadrasa")}</Link>
            </Button>
          ) : null}
        </div>
      </AuthCardShell>
    </AuthPageFrame>
  );
}
