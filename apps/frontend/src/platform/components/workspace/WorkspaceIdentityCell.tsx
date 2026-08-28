import React from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import WorkspaceLogo from '@/platform/components/WorkspaceLogo';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { ExternalLink } from 'lucide-react';

interface WorkspaceIdentityCellProps {
  workspace: PlatformWorkspaceRowData;
  appDomain: string;
}

export function WorkspaceIdentityCell({
  workspace,
  appDomain,
}: WorkspaceIdentityCellProps): React.JSX.Element {
  const tenantLink = tenantUrl(workspace.subdomain, '/');

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
          <h3 className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
            {workspace.madrasaName}
          </h3>
          <a
            href={tenantLink}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${workspace.subdomain}.${appDomain}`}
            className="text-muted-foreground hover:text-primary transition-colors inline-flex p-1 rounded-lg hover:bg-primary/10"
            aria-label={`Open ${workspace.subdomain}.${appDomain}`}
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </a>
        </div>
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 border border-border/50 font-mono text-2xs">
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
