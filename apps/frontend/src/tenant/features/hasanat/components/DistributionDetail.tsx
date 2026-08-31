import React from 'react';
import { Send } from 'lucide-react';
import type { Distribution } from '@/lib/data/hasanatData';
import { useTranslation } from '@/hooks/useTranslation';
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import { DetailDrawerArchivedBanner, DetailDrawerRestoreOrEditAction } from '@/components/ui/DetailDrawerArchiveChrome';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';

export interface DistributionDetailProps {
  distribution: Distribution;
  onClose: () => void;
  onEdit?: (distribution: Distribution) => void;
  canDelete?: boolean;
  onRestore?: (id: string) => void | Promise<void>;
}

export const DistributionDetail = React.memo(function DistributionDetail({
  distribution,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: DistributionDetailProps) {
  const { t } = useTranslation();
  const isArchived = !!distribution.deletedAt;

  return (
    <DetailDrawerShell
      open
      onClose={onClose}
      title={t('hasanat.detail.title')}
      subtitle={distribution.recipientName || 'Recipient'}
      icon={Send}
      headerExtra={isArchived && <DetailDrawerArchivedBanner deletedAt={distribution.deletedAt} />}
      headerActions={
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canEdit={!!onEdit}
          canRestore={canDelete}
          onEdit={() => onEdit?.(distribution)}
          onRestore={() => onRestore?.(distribution.id)}
          restoreLabel={t('common.restore')}
          editLabel={t('common.edit')}
        />
      }
    >
      <div className="flex flex-col gap-6 py-6">
        <section>
          <DetailSectionTitle>{t('hasanat.detail.overview')}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('hasanat.fields.denomination')}
                value={distribution.denominationName} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.recipient')}
                value={distribution.recipientName} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.quantity')}
                value={distribution.quantity} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.status')}
                value={distribution.status} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.issuedDate')}
                value={distribution.issuedDate} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.issuedBy')}
                value={distribution.issuedBy || '—'} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.reason')}
                value={distribution.reason || '—'} 
              />
            </div>
          </Card>
        </section>
      </div>
    </DetailDrawerShell>
  );
});
