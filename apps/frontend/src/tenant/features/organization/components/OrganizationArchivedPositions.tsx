/**
 * @file OrganizationArchivedPositions.tsx
 * @description Trash list + restore CTA for archived organization positions.
 */

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useOrganizationPositions,
  useRestorePosition,
} from '@/tenant/hooks/collections/organization';

export function OrganizationArchivedPositions(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: positions = [], isLoading } = useOrganizationPositions({ includeDeleted: true });
  const restoreMutation = useRestorePosition();

  async function handleRestore(id: string) {
    try {
      await restoreMutation.mutateAsync(id);
      notify.success(t('organization.position.restored'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.position.restoreFailed'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  }

  if (positions.length === 0) {
    return <EmptyState title={t('organization.trashEmptyTitle')} />;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">
        {t('organization.positionsTrash')}
      </h3>
      <ul className="space-y-2">
        {positions.map((position) => (
          <li
            key={position.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
          >
            <div className="min-w-0 text-start">
              <p className="text-sm font-medium text-foreground truncate">{position.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{position.code}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 gap-1.5"
              disabled={restoreMutation.isPending}
              onClick={() => void handleRestore(position.id)}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t('organization.restore')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
