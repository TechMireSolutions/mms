import { motion } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import type { Payment } from '@/lib/data/financeData';

export interface PaymentsListDesktopTableProps {
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

export function PaymentsListDesktopTable({
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
}: PaymentsListDesktopTableProps): React.JSX.Element {
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
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("date") ? { id: "date", label: t('finance.columns.paymentDate') } : null,
          isColumnVisible("student") ? { id: "student", label: t('finance.columns.student') } : null,
          isColumnVisible("invoice") ? { id: "invoice", label: t('finance.columns.invoice') } : null,
          isColumnVisible("amount") ? { id: "amount", label: t('finance.columns.amount') } : null,
          isColumnVisible("method") ? { id: "method", label: t('finance.columns.method') } : null,
          isColumnVisible("receivedBy") ? { id: "receivedBy", label: t('finance.columns.receivedBy') } : null,
          isColumnVisible("note") ? { id: "note", label: t('finance.columns.note') } : null,
        ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canDelete ? {
          allSelected: allSelected,
          someSelected: selectedIds.length > 0 && !allSelected,
          onSelectAll: () => onToggleAll(!allSelected),
          ariaLabel: t('finance.trash.selectAll')
        } : undefined}
        actionsLabel={canDelete ? t('common.actions') : undefined}
      />
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
              {isColumnVisible("note") && <TableCell className="max-w-cell-sm truncate px-3 py-2.5 text-sm text-muted-foreground">{payment.note || '—'}</TableCell>}
              {canDelete && <TableCell className="px-3 py-2.5">{renderRowAction(payment.id)}</TableCell>}
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  );
}
