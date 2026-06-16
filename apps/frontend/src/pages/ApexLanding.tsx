import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import WorkspaceRegistryList from "@/components/routing/WorkspaceRegistryList";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain } from "@/lib/config/tenantConfig";
import useTranslation from "@/hooks/useTranslation";

/**
 * Marketing / entry page on the apex domain only.
 * Each madrasa is created via onboarding and lives on its own subdomain.
 */
export default function ApexLanding(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const exampleHost = `your-madrasa.${appDomain}`;

  return (
    <div
      dir="ltr"
      className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg mx-auto text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-primary font-display text-2xl font-bold">م</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("apex.landingTitle")}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("apex.landingSubtitle", { example: exampleHost })}
          </p>
        </div>

        <WorkspaceRegistryList headingKey="apex.signInToYourMadrasa" />

        <Link
          to={ROUTES.onboarding}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          {t("auth.createMadrasa")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
        <p className="text-xs text-muted-foreground">
          {t("apex.landingLinkHint", { example: exampleHost })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("apex.alreadyHaveMadrasa")}{" "}
          <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
            {t("apex.goToSignInPicker")}
          </Link>
        </p>
      </div>
    </div>
  );
}
