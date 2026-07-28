import React from "react";
import { ShieldAlert } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl, getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";
import { AuthStatusHeader } from "@/components/entry/AuthStatusBanner";
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
    <>
      <EntryPageHead
        title={formatEntryTitle(t("platform.workspaceDisabledTitle"), t("entry.productName"))}
        description={t("entry.meta.workspaceDisabled")}
      />
      <AuthPageFrame>
        <AuthCardShell
          className="max-w-md"
          header={
            <AuthStatusHeader
              icon={ShieldAlert}
              tone="destructive"
              title={t("platform.workspaceDisabledTitle")}
              description={t("platform.workspaceDisabledMessage", {
                name: madrasaName,
                subdomain,
                domain: appDomain,
              })}
            />
          }
        >
          <Button asChild size="lg" className="h-11 w-full rounded-xl font-semibold">
            <a href={apexUrl(ROUTES.home)}>
              {t("platform.contactSuperAdmin")}
            </a>
          </Button>
        </AuthCardShell>
      </AuthPageFrame>
    </>
  );
}
