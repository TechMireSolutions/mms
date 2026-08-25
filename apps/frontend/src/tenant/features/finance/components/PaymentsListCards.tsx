import type React from 'react';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardMetadata } from '@/components/ui/DirectoryCardMetadata';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/data/financeData';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';

interface PaymentsListCardsProps {
  payments: Payment[];
  selectedIds: string[];
  isColumnVisible: (key: string) => boolean;
  canDelete: boolean;
  showDeleted: boolean;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  allSelected?: boolean;
}

export function PaymentsListCards({
  payments,
  selectedIds,
  isColumnVisible,
  canDelete,
  showDeleted,
  methodConfig,
  formatCurrency,
  onTogglePayment,
  onRequestDelete,
  onRestore,
  onToggleSelectAll,
  allSelected = false,
}: PaymentsListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <ModuleDirectoryCards
      items={payments}
      selectedIds={selectedIds}
      onSelectAll={canDelete && onToggleSelectAll ? () => onToggleSelectAll(!allSelected) : undefined}
      allSelected={allSelected}
      someSelected={selectedIds.length > 0 && selectedIds.length < payments.length}
      selectAllLabel={t("finance.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("finance.trash.selected", { count: selectedIds.length })}
      checkboxIdPrefix="finance-payments"
      renderItem={(payment) => {
        const isSelected = selectedIds.includes(payment.id);
        
        const metadataColumns = [];
        if (isColumnVisible("amount")) metadataColumns.push({ key: "amount", label: t('finance.columns.amount') });
        if (isColumnVisible("date")) metadataColumns.push({ key: "date", label: t('finance.columns.paymentDate') });
        if (isColumnVisible("method")) metadataColumns.push({ key: "method", label: t('finance.columns.method') });
        if (isColumnVisible("receivedBy")) metadataColumns.push({ key: "receivedBy", label: t('finance.columns.receivedBy') });
        if (isColumnVisible("note")) metadataColumns.push({ key: "note", label: t('finance.columns.note') });

        return (
          <DirectoryEntityCard key={payment.id} isSelected={isSelected} reducedMotion={reducedMotion}>
            <DirectoryCardHeader
              id={payment.id}
              displayName={payment.studentName || t("finance.payments")}
              isSelected={isSelected}
              showSelect={canDelete}
              onSelect={() => onTogglePayment(payment.id, !isSelected)}
              selectAriaLabel={t("finance.trash.selectPayment", { id: payment.id })}
              reducedMotion={reducedMotion}
              subtitle={
                isColumnVisible("invoice") && payment.invoiceId 
                  ? <p className="font-mono text-xs text-muted-foreground truncate">{payment.invoiceId}</p>
                  : undefined
              }
            />

            <DirectoryCardMetadata
              columns={metadataColumns}
              keyFor={(col) => col.key}
              labelFor={(col) => col.label}
              renderValue={(col) => {
                if (col.key === "amount") return <span className="font-bold text-success">{formatCurrency(payment.amount)}</span>;
                if (col.key === "date") return formatDate(payment.date);
                if (col.key === "method") return <StatusBadge status={payment.method} config={methodConfig} size="sm" />;
                if (col.key === "receivedBy") return payment.receivedBy || '—';
                if (col.key === "note") return payment.note || '—';
                return null;
              }}
            />

            {canDelete && (
              <DirectoryCardFooter
                trailing={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
                    onClick={() => showDeleted ? onRestore?.(payment.id) : onRequestDelete(payment.id)}
                    aria-label={showDeleted ? t('finance.trash.restore') : t('common.delete')}
                  >
                    {showDeleted ? <RotateCcw className="h-4 w-4 text-muted-foreground" /> : <Trash2 className="h-4 w-4 text-destructive/70" />}
                  </Button>
                }
              />
            )}
          </DirectoryEntityCard>
        );
      }}
    />
  );
}
