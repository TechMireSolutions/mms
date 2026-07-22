import React, { memo } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { AppTranslationKey, PublicWorkspaceSummary } from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain, tenantUrl } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkspaceRegistry } from "@/platform/hooks/useWorkspaceRegistry";
import WorkspaceLogo from "@/platform/components/WorkspaceLogo";
import PlatformSpinner from "@/platform/components/PlatformSpinner";
import PlatformRetryBlock from "@/platform/components/PlatformRetryBlock";

type WorkspaceLinkDestination = typeof ROUTES.login | typeof ROUTES.forgotPassword;

interface WorkspaceRegistryListProps {
  headingKey?: AppTranslationKey;
  emptyMessageKey?: AppTranslationKey;
  destinationPath?: WorkspaceLinkDestination;
  actionLabelKey?: AppTranslationKey;
}

/**
 * Fetches and renders all registered madrasa workspaces as prominent sign-in links.
 */
export default function WorkspaceRegistryList({
  headingKey = "apex.registeredMadrasas",
  emptyMessageKey = "apex.noMadrasasYet",
  destinationPath = ROUTES.login,
  actionLabelKey = "auth.signInTo",
}: WorkspaceRegistryListProps): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = useWorkspaceRegistry();

  if (isLoading) {
    return <PlatformSpinner label={t("apex.loadingMadrasas")} />;
  }

  if (isError) {
    return (
      <PlatformRetryBlock
        errorText={t("apex.loadError")}
        retryText={t("common.retry")}
        isFetching={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  const items = workspaces ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">{t(emptyMessageKey)}</p>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
        {t(headingKey)}
      </p>
      <ul className="space-y-3">
        {items.map((workspace) => (
          <RegistryWorkspaceRow
            key={workspace.subdomain}
            workspace={workspace}
            appDomain={appDomain}
            destinationPath={destinationPath}
            actionLabelKey={actionLabelKey}
          />
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
        <ExternalLink className="w-3 h-3" aria-hidden />
        {t("apex.opensSignInHint")}
      </p>
    </div>
  );
}

const RegistryWorkspaceRow = memo(function RegistryWorkspaceRow({
  workspace,
  appDomain,
  destinationPath,
  actionLabelKey,
}: {
  workspace: PublicWorkspaceSummary;
  appDomain: string;
  destinationPath: WorkspaceLinkDestination;
  actionLabelKey: AppTranslationKey;
}): React.JSX.Element {
  const { t } = useTranslation();
  const targetUrl = tenantUrl(workspace.subdomain, destinationPath);

  return (
    <li>
      <a
        href={targetUrl}
        className="block w-full rounded-xl border-2 border-border bg-card p-4 shadow-sm hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group text-start"
      >
        <div className="flex items-center gap-3">
          <WorkspaceLogo logoUrl={workspace.logoUrl} madrasaName={workspace.madrasaName} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
              {workspace.madrasaName}
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {workspace.subdomain}.{appDomain}
            </p>
            {workspace.tagline ? (
              <p className="text-xs text-muted-foreground mt-0.5">{workspace.tagline}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground group-hover:bg-primary/90">
          {t(actionLabelKey, { name: workspace.madrasaName })}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </div>
      </a>
    </li>
  );
});
