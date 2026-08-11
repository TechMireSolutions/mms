import type { JSX } from 'react';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCardsSelectAllBar } from '@/components/ui/DirectoryCardsSelectAllBar';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { DistributionRowActions } from '@/tenant/features/hasanat/components/DistributionRowActions';
import {
  getDistributionDenomination,
  getDistributionStatuses,
  type DistributionManagerListProps,
} from '@/tenant/features/hasanat/components/distributionManagerListShared';

type DistributionManagerListCardsProps = Omit<
  DistributionManagerListProps,
  'getColumnWidth' | 'onColumnResize'
>;

export function DistributionManagerListCards(props: DistributionManagerListCardsProps): JSX.Element {
  const {
    distributions,
    denoms,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    isColumnVisible,
    statusLabels,
    statusConfig,
    canWrite,
    canDelete,
    showDeleted,
    canRestoreRows,
    canDeleteRows,
    onMessage,
    onChangeStatus,
    onToggleSelectedDistribution,
    onToggleSelectAll,
    onTrashAction,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const statuses = getDistributionStatuses(statusConfig);
  const pageCountLabel = formatDirectoryPageCountLabel(distributions.length, t, {
    singular: 'hasanat.item.distribution',
    plural: 'hasanat.item.distributions',
  });

  return (
    <>
      {canDelete && distributions.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="hasanat-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t('hasanat.trash.selectAll')}
          deselectLabel={t('common.deselect')}
          selectedCount={selectedIds.length}
          selectedCountLabel={t('hasanat.trash.selected', { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {distributions.map((distribution) => {
          const denomination = getDistributionDenomination(denoms, distribution.denominationId);
          const isSelected = selectedIds.includes(distribution.id);

          return (
            <DirectoryEntityCard key={distribution.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={distribution.id}
                displayName={distribution.recipientName || distribution.id}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelectedDistribution(distribution.id, !isSelected)}
                selectAriaLabel={t('hasanat.trash.selectDistribution', { name: distribution.recipientName || distribution.id })}
                reducedMotion={reducedMotion}
                subtitle={
                  isColumnVisible('card') && denomination ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <span aria-hidden="true">{denomination.icon || '⭐'}</span>
                      <span className="truncate">{distribution.denominationName}</span>
                      <span className="font-bold" style={{ color: denomination.color }}>
                        {t('hasanat.form.pointsShort', { points: denomination.points })}
                      </span>
                    </p>
                  ) : undefined
                }
              />

              <dl className="ms-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {isColumnVisible('recipientClass') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.recipientClass')}</dt>
                    <dd className="text-foreground">{distribution.recipientClass || '—'}</dd>
                  </div>
                )}
                {isColumnVisible('quantity') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.quantity')}</dt>
                    <dd className="font-bold text-foreground">{distribution.quantity}</dd>
                  </div>
                )}
                {isColumnVisible('reason') && (
                  <div className={isColumnVisible('recipientClass') || isColumnVisible('quantity') ? '' : 'sm:col-span-2'}>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.reason')}</dt>
                    <dd className="break-words text-foreground">{distribution.reason || '—'}</dd>
                  </div>
                )}
                {isColumnVisible('issuedDate') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.issuedDate')}</dt>
                    <dd className="text-foreground">{distribution.issuedDate}</dd>
                  </div>
                )}
                {isColumnVisible('issuedBy') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.issuedBy')}</dt>
                    <dd className="break-words text-foreground">{distribution.issuedBy || '—'}</dd>
                  </div>
                )}
                {isColumnVisible('status') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('hasanat.columns.distribution.status')}</dt>
                    <dd className="pt-1">
                      <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                    </dd>
                  </div>
                )}
              </dl>

              <DirectoryCardFooter
                trailing={
                  <DistributionRowActions
                    distribution={distribution}
                    statuses={statuses}
                    statusLabels={statusLabels}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    canRestoreRows={canRestoreRows}
                    canDeleteRows={canDeleteRows}
                    triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
                    onMessage={
                      onMessage
                        ? (channel, dist) => onMessage(channel, [dist])
                        : undefined
                    }
                    onChangeStatus={onChangeStatus}
                    onTrashAction={onTrashAction}
                  />
                }
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
