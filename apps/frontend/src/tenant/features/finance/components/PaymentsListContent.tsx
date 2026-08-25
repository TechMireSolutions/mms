import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { PaymentLogHeader } from '@/tenant/features/finance/components/PaymentsListFilters';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import type { Payment } from '@/lib/data/financeData';
import { PaymentsListCards } from '@/tenant/features/finance/components/PaymentsListCards';
import { PaymentsListDesktopTable } from '@/tenant/features/finance/components/PaymentsListDesktopTable';
import { WORK_SURFACE } from '@/components/ui/formStyles';

export const PAYMENT_TRACKER_COLUMN_KEYS = [
  "date",
  "student",
  "invoice",
  "amount",
  "method",
  "receivedBy",
  "note",
] as const;

interface PaymentsListContentProps {
  payments: Payment[];
  selectedIds: string[];
  isColumnVisible: (key: string) => boolean;
  visibleColCount: number;
  allSelected: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  totalPaid: number;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  columnCustomizer?: ModuleColumnCustomizerProps;
  formatCurrency: (amount: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onRowClick?: (id: string) => void;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
}

export function PaymentsListContent({
  payments,
  selectedIds,
  isColumnVisible,
  visibleColCount,
  allSelected,
  canDelete,
  showDeleted,
  totalPaid,
  methodConfig,
  columnCustomizer,
  formatCurrency,
  getColumnWidth,
  onColumnResize,
  onTogglePayment,
  onToggleAll,
  onRequestDelete,
  onRestore,
}: PaymentsListContentProps) {
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const listProps = {
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
  };

  return (
    <div className={WORK_SURFACE}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3">
        <PaymentLogHeader totalPaid={totalPaid} formatCurrency={formatCurrency} columnCustomizer={columnCustomizer} />
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      {viewMode === "cards" ? (
        <div className="space-y-3 p-3">
          <PaymentsListCards {...listProps} />
        </div>
      ) : (
        <div>
          <PaymentsListDesktopTable
            {...listProps}
            visibleColCount={visibleColCount}
            allSelected={allSelected}
            getColumnWidth={getColumnWidth}
            onColumnResize={onColumnResize}
            onToggleAll={onToggleAll}
          />
        </div>
      )}
    </div>
  );
}
