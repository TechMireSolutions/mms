import React from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import WorkspaceLogo from '@/platform/components/WorkspaceLogo';
import { tenantUrl } from '@/lib/config/tenantConfig';

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
        <h3 className="text-base font-black tracking-tight text-foreground truncate">
          {workspace.madrasaName}
        </h3>
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <a
            href={tenantLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary/80 font-bold hover:underline"
          >
            {workspace.subdomain}
          </a>
          <span className="text-muted-foreground/60">.{appDomain}</span>
        </p>
      </div>
    </div>
  );
}
