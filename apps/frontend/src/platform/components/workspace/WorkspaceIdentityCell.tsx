import React from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import WorkspaceLogo from '@/platform/components/WorkspaceLogo';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface WorkspaceIdentityCellProps {
  workspace: PlatformWorkspaceRowData;
  appDomain: string;
}

export function WorkspaceIdentityCell({
  workspace,
  appDomain,
}: WorkspaceIdentityCellProps): React.JSX.Element {
  const { t } = useTranslation();
  const tenantLink = tenantUrl(workspace.subdomain, '/');
  const openTitle = `${t('platform.openWorkspace')} (${workspace.subdomain}.${appDomain})`;

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <WorkspaceLogo
          logoUrl={workspace.logoUrl}
          madrasaName={workspace.madrasaName}
          className="rounded-xl border border-border/40 shadow-2xs"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <a
            href={tenantLink}
            target="_blank"
            rel="noopener noreferrer"
            title={openTitle}
            className="text-sm font-bold tracking-tight text-foreground truncate hover:text-primary transition-colors inline-flex items-center gap-1.5 group/link"
          >
            <span className="truncate">{workspace.madrasaName}</span>
            <ExternalLink
              className="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover/link:text-primary transition-colors"
              aria-hidden
            />
          </a>
        </div>
        {workspace.tagline ? (
          <p className="text-xs font-medium text-muted-foreground/75 truncate">
            {workspace.tagline}
          </p>
        ) : null}
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <div
            dir="ltr"
            className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 border border-border/50 font-mono text-2xs"
          >
            <span className="font-bold text-primary">{workspace.subdomain}</span>
            <span className="text-muted-foreground/70">.{appDomain}</span>
          </div>
          <CopyBtn
            text={tenantLink}
            className="h-6 w-6 min-h-6 min-w-6 p-0 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity rounded-md"
            showToast
          />
        </div>
      </div>
    </div>
  );
}
