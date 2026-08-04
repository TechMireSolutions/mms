import { motion } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Payment } from '@/lib/data/financeData';

interface PaymentTrackerListTableProps {
  payments: Payment[];
  selectedIds: string[];
  isColumnVisible: (key: string) => boolean;
  visibleColCount: number;
  allSelected: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
}

export function PaymentTrackerListTable({
  payments,
  selectedIds,
  isColumnVisible,
  visibleColCount,
  allSelected,
  canDelete,
  showDeleted,
  methodConfig,
  formatCurrency,
  getColumnWidth,
  onColumnResize,
  onTogglePayment,
  onToggleAll,
  onRequestDelete,
  onRestore,
}: PaymentTrackerListTableProps) {
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

  return (
    <table className="w-full table-fixed text-sm">
      <caption className="sr-only">{t('finance.paymentLog')}</caption>
      <thead>
        <tr className="border-b border-border/50">
          {canDelete && (
            <th scope="col" className="w-10 px-3 py-2.5">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label={t('finance.trash.selectAll')}
              />
            </th>
          )}
          {isColumnVisible("date") && (
            <ResizableTableHead columnKey="date" width={getColumnWidth?.('date')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.paymentDate')}
            </ResizableTableHead>
          )}
          {isColumnVisible("student") && (
            <ResizableTableHead columnKey="student" width={getColumnWidth?.('student')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.student')}
            </ResizableTableHead>
          )}
          {isColumnVisible("invoice") && (
            <ResizableTableHead columnKey="invoice" width={getColumnWidth?.('invoice')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.invoice')}
            </ResizableTableHead>
          )}
          {isColumnVisible("amount") && (
            <ResizableTableHead columnKey="amount" width={getColumnWidth?.('amount')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.amount')}
            </ResizableTableHead>
          )}
          {isColumnVisible("method") && (
            <ResizableTableHead columnKey="method" width={getColumnWidth?.('method')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.method')}
            </ResizableTableHead>
          )}
          {isColumnVisible("receivedBy") && (
            <ResizableTableHead columnKey="receivedBy" width={getColumnWidth?.('receivedBy')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.receivedBy')}
            </ResizableTableHead>
          )}
          {isColumnVisible("note") && (
            <ResizableTableHead columnKey="note" width={getColumnWidth?.('note')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t('finance.columns.note')}
            </ResizableTableHead>
          )}
          {canDelete && <th scope="col" className="w-12 px-3 py-2.5"><span className="sr-only">{t('common.actions')}</span></th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {payments.length === 0 ? (
          <tr><td colSpan={visibleColCount || 1} className="py-4"><EmptyState title={t('finance.empty.payments')} compact /></td></tr>
        ) : (
          payments.map((payment, index) => (
            <motion.tr
              key={payment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="transition-colors hover:bg-muted/20"
            >
              {canDelete && (
                <td className="px-3 py-3">
                  <Checkbox
                    checked={selectedIds.includes(payment.id)}
                    onCheckedChange={(checked) => onTogglePayment(payment.id, checked === true)}
                    aria-label={t('finance.trash.selectPayment', { id: payment.id })}
                  />
                </td>
              )}
              {isColumnVisible("date") && <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(payment.date)}</td>}
              {isColumnVisible("student") && <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{payment.studentName}</td>}
              {isColumnVisible("invoice") && <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{payment.invoiceId}</td>}
              {isColumnVisible("amount") && <td className="px-4 py-3 text-sm font-bold text-success whitespace-nowrap">{formatCurrency(payment.amount)}</td>}
              {isColumnVisible("method") && <td className="px-4 py-3"><StatusBadge status={payment.method} config={methodConfig} size="sm" /></td>}
              {isColumnVisible("receivedBy") && <td className="px-4 py-3 text-sm text-muted-foreground">{payment.receivedBy || '—'}</td>}
              {isColumnVisible("note") && <td className="max-w-[10rem] truncate px-4 py-3 text-sm text-muted-foreground">{payment.note || '—'}</td>}
              {canDelete && <td className="px-3 py-3">{renderRowAction(payment.id)}</td>}
            </motion.tr>
          ))
        )}
      </tbody>
    </table>
  );
}
