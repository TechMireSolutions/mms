import type React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
import { ENTITY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/entityCardChrome';
import { EntityCardFooterActions } from '@/components/ui/EntityCardFooterActions';
import { EntityCardMetaTile } from '@/components/ui/EntityCardMetaTile';
import { EntityCardsGrid } from "@/components/ui/EntityCardsGrid";
import { EntityCard } from "@/components/ui/EntityCard";
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import type { Payment } from '@/lib/data/financeData';

export interface PaymentsListCardsProps {
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

function PaymentCard({
  payment,
  isColumnVisible,
  canDelete,
  showDeleted,
  methodConfig,
  formatCurrency,
  selectedIds,
  onTogglePayment,
  onRequestDelete,
  onRestore,
  reducedMotion,
}: {
  payment: Payment;
  isColumnVisible: (key: string) => boolean;
  canDelete: boolean;
  showDeleted: boolean;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  selectedIds: string[];
  onTogglePayment: (id: string, checked: boolean) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  reducedMotion: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { isSelected, onSelect, cardProps } = useWorkCardAction({
    entity: payment,
    selectedIds,
    onToggleSelected: onTogglePayment,
    canSelect: canDelete,
  });

  const trailingActions = canDelete ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={ENTITY_CARD_OVERFLOW_TRIGGER_CLASS}
      onClick={() => (showDeleted ? onRestore?.(payment.id) : onRequestDelete(payment.id))}
      aria-label={showDeleted ? t('finance.trash.restore') : t('common.delete')}
    >
      {showDeleted
        ? <RotateCcw className="h-4 w-4 text-muted-foreground" />
        : <Trash2 className="h-4 w-4 text-destructive" />}
    </Button>
  ) : null;

  return (
    <EntityCard
      key={payment.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      accentClassName="bg-success/60 group-hover:bg-success"
      {...cardProps}
    >
      <EntityCard.Header
        id={payment.id}
        displayName={payment.studentName || t("finance.payments")}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t("finance.trash.selectPayment", { id: payment.id })}
        reducedMotion={reducedMotion}
        subtitle={
          isColumnVisible("invoice") && payment.invoiceId
            ? <p className="font-mono text-xs text-muted-foreground truncate">{payment.invoiceId}</p>
            : undefined
        }
      />

      <EntityCard.MetaGrid>
        {isColumnVisible("amount") && (
          <EntityCardMetaTile label={t('finance.columns.amount')}>
            <span className="font-bold text-success">{formatCurrency(payment.amount)}</span>
          </EntityCardMetaTile>
        )}
        {isColumnVisible("date") && (
          <EntityCardMetaTile label={t('finance.columns.paymentDate')}>
            {formatDate(payment.date)}
          </EntityCardMetaTile>
        )}
        {isColumnVisible("method") && (
          <EntityCardMetaTile label={t('finance.columns.method')}>
            <StatusBadge status={payment.method} config={methodConfig} size="sm" />
          </EntityCardMetaTile>
        )}
        {isColumnVisible("receivedBy") && (
          <EntityCardMetaTile label={t('finance.columns.receivedBy')}>
            {payment.receivedBy || '—'}
          </EntityCardMetaTile>
        )}
        {isColumnVisible("note") && (
          <EntityCardMetaTile label={t('finance.columns.note')}>
            {payment.note || '—'}
          </EntityCardMetaTile>
        )}
      </EntityCard.MetaGrid>

      {/* Footer rendered unconditionally — preserves border-divider chrome when canDelete=false. */}
      <EntityCardFooterActions actions={trailingActions} />
    </EntityCard>
  );
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
  const someSelected = selectedIds.length > 0 && selectedIds.length < payments.length;

  return (
    <EntityCardsGrid
      items={payments}
      selectedIds={selectedIds}
      onSelectAll={canDelete && onToggleSelectAll ? () => onToggleSelectAll(!allSelected) : undefined}
      allSelected={allSelected}
      someSelected={someSelected}
      selectAllLabel={t("finance.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("finance.trash.selected", { count: selectedIds.length })}
      checkboxIdPrefix="finance-payments"
      renderItem={(payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          isColumnVisible={isColumnVisible}
          canDelete={canDelete}
          showDeleted={showDeleted}
          methodConfig={methodConfig}
          formatCurrency={formatCurrency}
          selectedIds={selectedIds}
          onTogglePayment={onTogglePayment}
          onRequestDelete={onRequestDelete}
          onRestore={onRestore}
          reducedMotion={reducedMotion}
        />
      )}
    />
  );
}
