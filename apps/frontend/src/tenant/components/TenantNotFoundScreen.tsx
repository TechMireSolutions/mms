import React from "react";
import { Building2 } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";
import { AuthStatusHeader } from "@/components/entry/AuthStatusBanner";
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
    <>
      <EntryPageHead
        title={formatEntryTitle(t("apex.workspaceNotFoundTitle"), t("entry.productName"))}
        description={t("entry.meta.workspaceNotFound")}
      />
      <AuthPageFrame>
        <AuthCardShell
          className="max-w-md"
          header={
            <AuthStatusHeader
              icon={Building2}
              title={t("apex.workspaceNotFoundTitle")}
              description={t("apex.workspaceNotFoundMessage", { subdomain })}
            />
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
    </>
  );
}
