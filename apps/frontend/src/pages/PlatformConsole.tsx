import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogOut, Plus } from "lucide-react";
import WorkspaceRegistryList from "@/components/routing/WorkspaceRegistryList";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import useTranslation from "@/hooks/useTranslation";
import { ROUTES } from "@/lib/config/routes";

/**
 * Authenticated apex console — super-user provisions new madrasa workspaces.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();

  return (
    <div
      dir="ltr"
      className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg mx-auto text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-primary font-display text-2xl font-bold">م</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("platform.consoleTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("platform.consoleSubtitle", { name: platformUser?.name ?? "" })}
          </p>
        </div>

        <Link
          to={ROUTES.onboarding}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t("auth.createMadrasa")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>

        <WorkspaceRegistryList headingKey="apex.registeredMadrasas" />

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
    </div>
  );
}
