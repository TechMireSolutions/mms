import React from "react";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";
import useTranslation from "@/hooks/useTranslation";

interface TenantNotFoundScreenProps {
  subdomain: string;
}

/** Shown when the browser host subdomain has no registered workspace. */
export default function TenantNotFoundScreen({
  subdomain,
}: TenantNotFoundScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      dir="ltr"
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-background"
    >
      <h1 className="text-xl font-semibold text-foreground">
        {t("apex.workspaceNotFoundTitle")}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md">
        {t("apex.workspaceNotFoundMessage", { subdomain })}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <a
          href={apexUrl(ROUTES.onboarding)}
          className="inline-flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          {t("apex.workspaceNotFoundCreate")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </a>
        <a
          href={apexUrl(ROUTES.login)}
          className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {t("apex.workspaceNotFoundViewAll")}
        </a>
      </div>
    </div>
  );
}
