import { motion } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Payment } from '@/lib/data/financeData';
import type { PaymentTrackerVisibleColumns } from '@/tenant/features/finance/components/PaymentTrackerList';

interface PaymentTrackerListMobileProps {
  payments: Payment[];
  selectedIds: string[];
  visibleColumns: PaymentTrackerVisibleColumns;
  canDelete: boolean;
  showDeleted: boolean;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
}

export function PaymentTrackerListMobile({
  payments,
  selectedIds,
  visibleColumns,
  canDelete,
  showDeleted,
  methodConfig,
  formatCurrency,
  onTogglePayment,
  onRequestDelete,
  onRestore,
}: PaymentTrackerListMobileProps) {
  const { t } = useTranslation();

  const renderRowAction = (paymentId: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => showDeleted ? onRestore?.(paymentId) : onRequestDelete(paymentId)}
      aria-label={showDeleted ? t('finance.trash.restore') : t('common.delete')}
    >
      {showDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );

  if (payments.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('finance.empty.payments')}</p>;
  }

  return (
    <>
      {payments.map((payment, index) => (
        <motion.article
          key={payment.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          className="space-y-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              {visibleColumns.student && <h4 className="truncate text-sm font-semibold text-foreground">{payment.studentName}</h4>}
              {visibleColumns.invoice && <p className="truncate font-mono text-xs text-muted-foreground">{payment.invoiceId}</p>}
            </div>
            {visibleColumns.amount && <span className="shrink-0 text-sm font-bold text-success">{formatCurrency(payment.amount)}</span>}
          </div>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {visibleColumns.date && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('finance.columns.paymentDate')}</dt>
                <dd className="text-foreground">{formatDate(payment.date)}</dd>
              </div>
            )}
            {visibleColumns.method && (
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('finance.columns.method')}</dt>
                <dd><StatusBadge status={payment.method} config={methodConfig} size="sm" /></dd>
              </div>
            )}
            {visibleColumns.receivedBy && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('finance.columns.receivedBy')}</dt>
                <dd className="break-words text-foreground">{payment.receivedBy || '—'}</dd>
              </div>
            )}
            {visibleColumns.note && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('finance.columns.note')}</dt>
                <dd className="break-words text-foreground">{payment.note || '—'}</dd>
              </div>
            )}
          </dl>
          {canDelete && (
            <div className="flex items-center justify-between border-t border-border pt-2">
              <Checkbox
                checked={selectedIds.includes(payment.id)}
                onCheckedChange={(checked) => onTogglePayment(payment.id, checked === true)}
                aria-label={t('finance.trash.selectPayment', { id: payment.id })}
              />
              {renderRowAction(payment.id)}
            </div>
          )}
        </motion.article>
      ))}
    </>
  );
}
