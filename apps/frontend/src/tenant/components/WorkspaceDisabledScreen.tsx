import React from "react";
import { ShieldAlert } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl, getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";
import { Button } from "@/components/ui/button";

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
    <AuthPageFrame>
      <AuthCardShell
        className="max-w-md"
        header={
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("platform.workspaceDisabledTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("platform.workspaceDisabledMessage", {
                  name: madrasaName,
                  subdomain,
                  domain: appDomain,
                })}
              </p>
            </div>
          </div>
        }
      >
        <Button asChild size="lg" className="h-11 w-full rounded-xl font-semibold">
          <a href={apexUrl(ROUTES.home)}>
            {t("platform.contactSuperAdmin")}
          </a>
        </Button>
      </AuthCardShell>
    </AuthPageFrame>
  );
}
