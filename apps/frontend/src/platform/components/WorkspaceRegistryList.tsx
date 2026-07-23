import React, { memo } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppTranslationKey, PublicWorkspaceSummary } from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain, tenantUrl } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkspaceRegistry } from "@/platform/hooks/useWorkspaceRegistry";
import WorkspaceLogo from "@/platform/components/WorkspaceLogo";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorState } from "@/components/ui/ErrorState";
import { containerVariants, cardVariants } from "@/platform/lib/animations";

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
  const { data: workspaces, isLoading, isError, refetch } = useWorkspaceRegistry();

  if (isLoading) {
    return <RouteStatusFallback />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("apex.loadError")}
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
    <div className="space-y-3 w-full">
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 text-center">
        {t(headingKey)}
      </p>
      <motion.ul 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        <AnimatePresence>
          {items.map((workspace) => (
            <RegistryWorkspaceRow
              key={workspace.subdomain}
              workspace={workspace}
              appDomain={appDomain}
              destinationPath={destinationPath}
              actionLabelKey={actionLabelKey}
            />
          ))}
        </AnimatePresence>
      </motion.ul>
      <p className="text-[10px] font-bold text-muted-foreground/70 text-center flex items-center justify-center gap-1.5 pt-1">
        <ExternalLink className="w-3.5 h-3.5" aria-hidden />
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
    <motion.li variants={cardVariants} layout>
      <a
        href={targetUrl}
        className="block w-full rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4.5 shadow-sm hover:border-primary/30 hover:bg-card hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer group text-start"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            <WorkspaceLogo logoUrl={workspace.logoUrl} madrasaName={workspace.madrasaName} className="border border-border/30 rounded-xl" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {workspace.madrasaName}
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all opacity-85">
              {workspace.subdomain}.{appDomain}
            </p>
            {workspace.tagline ? (
              <p className="text-[11px] font-medium text-muted-foreground/75 truncate">{workspace.tagline}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary h-10 text-xs font-bold text-primary-foreground group-hover:bg-primary/95 transition-colors shadow-sm shadow-primary/10 group-hover:shadow">
          {t(actionLabelKey, { name: workspace.madrasaName })}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-250" aria-hidden />
        </div>
      </a>
    </motion.li>
  );
});
