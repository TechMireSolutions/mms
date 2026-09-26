import type { PlatformWorkspaceRow } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

export function WorkspaceSummary({ workspace, showAdminEmail = false }: {
  workspace: PlatformWorkspaceRow;
  showAdminEmail?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const fields = [
    { label: t('platform.descriptor.workspace.madrasaName'), value: workspace.madrasaName },
    { label: t('platform.descriptor.workspace.subdomain'), value: workspace.subdomain },
    ...(showAdminEmail ? [{ label: t('platform.adminEmailLabel'), value: workspace.adminEmail || '—' }] : []),
  ];
  return (
    <dl className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1 text-xs break-words">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <dt className="inline text-muted-foreground">{label}:</dt>{' '}
          <dd className="inline font-bold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
