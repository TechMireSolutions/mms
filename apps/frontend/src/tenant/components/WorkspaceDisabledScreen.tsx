import React from "react";
import { ShieldAlert } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl, getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";

interface WorkspaceDisabledScreenProps {
  madrasaName: string;
  subdomain: string;
}

/** Shown when a madrasa workspace exists but has been disabled by the platform administrator. */
export default function WorkspaceDisabledScreen({
  madrasaName,
  subdomain,
}: WorkspaceDisabledScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();

  return (
    <div
      dir="ltr"
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-5 bg-background"
    >
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-destructive" aria-hidden />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-xl font-semibold text-foreground">{t("platform.workspaceDisabledTitle")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("platform.workspaceDisabledMessage", { name: madrasaName, subdomain, domain: appDomain })}
        </p>
      </div>
      <a
        href={apexUrl(ROUTES.home)}
        className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
      >
        {t("platform.contactSuperAdmin")}
      </a>
    </div>
  );
}
