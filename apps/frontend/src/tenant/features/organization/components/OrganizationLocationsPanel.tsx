/** Locations list with create/edit/soft-delete/restore for multi-branch sites. */
import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import { useIndustryTerminology } from '@/tenant/hooks/useIndustryTerminology';
import { useOrganizationLocationsPanel } from '../hooks/useOrganizationLocationsPanel';
import { OrganizationLocationFormModal } from './OrganizationLocationFormModal';

export interface OrganizationLocationsPanelProps {
  canWrite?: boolean;
  canDelete?: boolean;
  viewingDeleted?: boolean;
}

export function OrganizationLocationsPanel({
  canWrite = true,
  canDelete = false,
  viewingDeleted = false,
}: OrganizationLocationsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const terminology = useIndustryTerminology();
  const panel = useOrganizationLocationsPanel(viewingDeleted);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground">{terminology.locationLabel}</h3>
          <p className="text-xs text-muted-foreground">{t('organization.locationsHint')}</p>
        </div>
        {canWrite && !viewingDeleted ? (
          <Button type="button" size="sm" className="min-h-11 gap-1.5" onClick={panel.openCreate}>
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </Button>
        ) : null}
      </div>

      {panel.locations.length === 0 ? (
        <EmptyState
          title={viewingDeleted ? t('organization.trashEmptyTitle') : t('organization.locationsEmpty')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {panel.locations.map((loc) => (
            <div
              key={loc.id}
              className="p-3 rounded-md border border-border bg-background space-y-2 text-start"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-3xs uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {loc.code}
                </span>
                <span className="text-3xs font-medium text-primary">{loc.type}</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground">{loc.name}</h4>
              {loc.city || loc.addressLine1 ? (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {[loc.addressLine1, loc.city, loc.region].filter(Boolean).join(', ')}
                </p>
              ) : null}
              <div className="flex gap-2 pt-1">
                {viewingDeleted && canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 gap-1.5"
                    onClick={() => void panel.handleRestore(loc.id)}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {t('organization.restore')}
                  </Button>
                ) : null}
                {!viewingDeleted && canWrite ? (
                  <>
                    <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => panel.openEdit(loc)}>
                      {t('common.edit')}
                    </Button>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-11 text-destructive"
                        onClick={() => void panel.handleDelete(loc.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <OrganizationLocationFormModal
        open={panel.open}
        isEdit={panel.isEdit}
        draft={panel.draft}
        saving={panel.saving}
        onClose={() => panel.setOpen(false)}
        onSave={() => void panel.handleSave()}
        onDraftChange={(patch) => panel.setDraft((d) => ({ ...d, ...patch }))}
      />
    </div>
  );
}
