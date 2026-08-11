import { motion } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <Table className="table-fixed">
      <caption className="sr-only">{t('finance.paymentLog')}</caption>
      <TableHeader>
        <TableRow className="border-b border-border/60 hover:bg-muted/30">
          {canDelete && (
            <TableHead className="w-10 px-3 py-2.5 h-auto">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label={t('finance.trash.selectAll')}
              />
            </TableHead>
          )}
          {isColumnVisible("date") && (
            <ModuleTableHeaderCell columnKey="date" width={getColumnWidth?.('date')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.paymentDate')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("student") && (
            <ModuleTableHeaderCell columnKey="student" width={getColumnWidth?.('student')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.student')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("invoice") && (
            <ModuleTableHeaderCell columnKey="invoice" width={getColumnWidth?.('invoice')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.invoice')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("amount") && (
            <ModuleTableHeaderCell columnKey="amount" width={getColumnWidth?.('amount')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.amount')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("method") && (
            <ModuleTableHeaderCell columnKey="method" width={getColumnWidth?.('method')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.method')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("receivedBy") && (
            <ModuleTableHeaderCell columnKey="receivedBy" width={getColumnWidth?.('receivedBy')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.receivedBy')}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("note") && (
            <ModuleTableHeaderCell columnKey="note" width={getColumnWidth?.('note')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('finance.columns.note')}
            </ModuleTableHeaderCell>
          )}
          {canDelete && <TableHead className="w-12 px-3 py-2.5 h-auto"><span className="sr-only">{t('common.actions')}</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/50">
        {payments.length === 0 ? (
          <TableRow className="hover:bg-transparent"><TableCell colSpan={visibleColCount || 1} className="py-4"><EmptyState title={t('finance.empty.payments')} compact /></TableCell></TableRow>
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
                <TableCell className="px-3 py-2.5">
                  <Checkbox
                    checked={selectedIds.includes(payment.id)}
                    onCheckedChange={(checked) => onTogglePayment(payment.id, checked === true)}
                    aria-label={t('finance.trash.selectPayment', { id: payment.id })}
                  />
                </TableCell>
              )}
              {isColumnVisible("date") && <TableCell className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{formatDate(payment.date)}</TableCell>}
              {isColumnVisible("student") && <TableCell className="px-3 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap">{payment.studentName}</TableCell>}
              {isColumnVisible("invoice") && <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{payment.invoiceId}</TableCell>}
              {isColumnVisible("amount") && <TableCell className="px-3 py-2.5 text-sm font-bold text-success whitespace-nowrap">{formatCurrency(payment.amount)}</TableCell>}
              {isColumnVisible("method") && <TableCell className="px-3 py-2.5"><StatusBadge status={payment.method} config={methodConfig} size="sm" /></TableCell>}
              {isColumnVisible("receivedBy") && <TableCell className="px-3 py-2.5 text-sm text-muted-foreground">{payment.receivedBy || '—'}</TableCell>}
              {isColumnVisible("note") && <TableCell className="max-w-[10rem] truncate px-3 py-2.5 text-sm text-muted-foreground">{payment.note || '—'}</TableCell>}
              {canDelete && <TableCell className="px-3 py-2.5">{renderRowAction(payment.id)}</TableCell>}
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  );
}
