import React from "react";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain, tenantUrl } from "@/lib/config/tenantConfig";
import useTranslation from "@/hooks/useTranslation";
import { useWorkspaceRegistry } from "@/hooks/useWorkspaceRegistry";
import { Button } from "@/components/ui/button";

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
    return (
      <div className="flex items-center justify-center py-8" role="status">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">{t("apex.loadingMadrasas")}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center space-y-3"
      >
        <p className="text-sm text-destructive">{t("apex.loadError")}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="text-primary"
        >
          {isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : null}
          {t("common.retry")}
        </Button>
      </div>
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
        {items.map((ws) => {
          const targetUrl = tenantUrl(ws.subdomain, destinationPath);
          return (
            <li key={ws.subdomain}>
              <a
                href={targetUrl}
                className="block w-full rounded-xl border-2 border-border bg-card p-4 shadow-sm hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  {ws.logoUrl ? (
                    <img
                      src={ws.logoUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain bg-background border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-primary font-display text-base font-bold">م</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                      {ws.madrasaName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {ws.subdomain}.{appDomain}
                    </p>
                    {ws.tagline ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{ws.tagline}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground group-hover:bg-primary/90">
                  {t(actionLabelKey, { name: ws.madrasaName })}
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
        <ExternalLink className="w-3 h-3" aria-hidden />
        {t("apex.opensSignInHint")}
      </p>
    </div>
  );
}
