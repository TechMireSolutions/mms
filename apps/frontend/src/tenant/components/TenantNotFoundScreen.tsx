import React from "react";
import { Building2 } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";
import { Button } from "@/components/ui/button";

interface TenantNotFoundScreenProps {
  subdomain: string;
}

/** Shown when the browser host subdomain has no registered workspace. */
export default function TenantNotFoundScreen({
  subdomain,
}: TenantNotFoundScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <AuthPageFrame>
      <AuthCardShell
        className="max-w-md"
        header={
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("apex.workspaceNotFoundTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("apex.workspaceNotFoundMessage", { subdomain })}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="h-11 w-full rounded-xl font-semibold">
            <a href={apexUrl(ROUTES.onboarding)}>
              {t("apex.workspaceNotFoundCreate")}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-xl">
            <a href={apexUrl(ROUTES.home)}>
              {t("apex.workspaceNotFoundViewAll")}
            </a>
          </Button>
        </div>
      </AuthCardShell>
    </AuthPageFrame>
  );
}
