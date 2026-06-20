import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, LogOut, Plus, UserCircle } from "lucide-react";
import PlatformPageShell, { PlatformLogoMark } from "@/components/platform/PlatformPageShell";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import useTranslation from "@/hooks/useTranslation";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";

const PlatformWorkspaceList = lazy(() => import("@/components/platform/PlatformWorkspaceList"));

function WorkspaceListFallback(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-8" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
      <span className="sr-only">{t("apex.loadingMadrasas")}</span>
    </div>
  );
}

/**
 * Authenticated apex console — super-user provisions new madrasa workspaces.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();

  return (
    <PlatformPageShell>
      <div className="text-center space-y-6">
        <PlatformLogoMark />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("platform.consoleTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("platform.consoleSubtitle", { name: platformUser?.name ?? "" })}
          </p>
        </div>

        <Button
          asChild
          className="w-full h-11 rounded-xl font-semibold"
          onMouseEnter={() => {
            void import("@/pages/onboarding/OnboardingWizard");
          }}
        >
          <Link to={ROUTES.onboarding}>
            <Plus className="w-4 h-4" aria-hidden />
            {t("auth.createMadrasa")}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </Button>

        <Suspense fallback={<WorkspaceListFallback />}>
          <PlatformWorkspaceList />
        </Suspense>

        <Button
          asChild
          variant="outline"
          className="w-full h-11 rounded-xl"
          onMouseEnter={() => {
            void import("@/pages/PlatformAccount");
          }}
        >
          <Link to={ROUTES.platformAccount}>
            <UserCircle className="w-4 h-4" aria-hidden />
            {t("platform.myAccount")}
          </Link>
        </Button>

        <div className="flex justify-center text-sm">
          <button
            type="button"
            onClick={platformLogout}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden />
            {t("platform.signOut")}
          </button>
        </div>
      </div>
    </PlatformPageShell>
  );
}
