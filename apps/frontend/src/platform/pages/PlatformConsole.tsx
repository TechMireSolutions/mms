import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogOut, Plus, UserCircle, UserPlus } from "lucide-react";
import { PlatformPageShell, PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import PlatformSpinner from "@/platform/components/PlatformSpinner";

const PlatformWorkspaceList = lazy(() => import("@/platform/components/PlatformWorkspaceList"));

function WorkspaceListFallback(): React.JSX.Element {
  const { t } = useTranslation();
  return <PlatformSpinner label={t("apex.loadingMadrasas")} />;
}

/**
 * Authenticated apex console — super-user provisions new madrasa workspaces.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();
  const isSuperUser = platformUser?.role === "super_user";

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

        {isSuperUser ? (
          <>
            <Button
              asChild
              className="w-full h-11 rounded-xl font-semibold"
              onMouseEnter={() => {
                void import("@/platform/pages/onboarding/OnboardingWizard");
              }}
            >
              <Link to={ROUTES.onboarding}>
                <Plus className="w-4 h-4" aria-hidden />
                {t("auth.createMadrasa")}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 rounded-xl"
              onMouseEnter={() => {
                void import("@/platform/pages/PlatformAdmins");
              }}
            >
              <Link to={ROUTES.platformAdmins}>
                <UserPlus className="w-4 h-4" aria-hidden />
                {t("platform.manageAdmins")}
              </Link>
            </Button>
          </>
        ) : null}

        <Suspense fallback={<WorkspaceListFallback />}>
          <PlatformWorkspaceList />
        </Suspense>

        <Button
          asChild
          variant="outline"
          className="w-full h-11 rounded-xl"
          onMouseEnter={() => {
            void import("@/platform/pages/PlatformAccount");
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
