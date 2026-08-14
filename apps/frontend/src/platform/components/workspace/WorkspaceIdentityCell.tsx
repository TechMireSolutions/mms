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
    <div className="flex items-start gap-4">
      <div className="relative group-hover:scale-105 transition-transform duration-300">
        <WorkspaceLogo
          logoUrl={workspace.logoUrl}
          madrasaName={workspace.madrasaName}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black tracking-tight text-foreground truncate">
            {workspace.madrasaName}
          </h3>
          <a
            href={tenantLink}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${workspace.subdomain}.${appDomain}`}
            className="text-muted-foreground hover:text-primary transition-colors inline-flex p-0.5 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </a>
        </div>
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <a
            href={tenantLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary/80 font-bold hover:underline"
          >
            {workspace.subdomain}
          </a>
          <span className="text-muted-foreground/60">.{appDomain}</span>
          <CopyBtn
            text={tenantLink}
            className="h-6 w-6 min-h-6 min-w-6 p-0 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
            showToast
          />
        </div>
      </div>
    </div>
  );
}
