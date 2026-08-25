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
      title={t('hasanat.detail.title' as any, { defaultValue: 'Distribution Details' }) as any}
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
          restoreLabel={t('common.restore' as any)}
          editLabel={t('common.edit' as any)}
        />
      }
    >
      <div className="flex flex-col gap-6 py-6">
        <section>
          <DetailSectionTitle>{t('hasanat.detail.overview' as any, { defaultValue: 'Overview' }) as any}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('hasanat.fields.denomination' as any, { defaultValue: 'Denomination' }) as any} 
                value={distribution.denominationName} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.recipient' as any, { defaultValue: 'Recipient' }) as any} 
                value={distribution.recipientName} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.quantity' as any, { defaultValue: 'Quantity' }) as any} 
                value={distribution.quantity} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.status' as any, { defaultValue: 'Status' }) as any} 
                value={distribution.status} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.issuedDate' as any, { defaultValue: 'Issued Date' }) as any} 
                value={distribution.issuedDate} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.issuedBy' as any, { defaultValue: 'Issued By' }) as any} 
                value={distribution.issuedBy || '—'} 
              />
              <DetailAttributeRow 
                label={t('hasanat.fields.reason' as any, { defaultValue: 'Reason' }) as any} 
                value={distribution.reason || '—'} 
              />
            </div>
          </Card>
        </section>
      </div>
    </DetailDrawerShell>
  );
});
