import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { Card } from '@/components/ui/card';
import { PaymentLogHeader } from '@/tenant/features/finance/components/PaymentTrackerToolbar';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import type { Payment } from '@/lib/data/financeData';
import { PaymentTrackerListMobile } from '@/tenant/features/finance/components/PaymentTrackerListMobile';
import { PaymentTrackerListTable } from '@/tenant/features/finance/components/PaymentTrackerListTable';

export interface PaymentTrackerVisibleColumns {
  date: boolean;
  student: boolean;
  invoice: boolean;
  amount: boolean;
  method: boolean;
  receivedBy: boolean;
  note: boolean;
}

interface PaymentTrackerListProps {
  payments: Payment[];
  selectedIds: string[];
  visibleColumns: PaymentTrackerVisibleColumns;
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
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
}

export function PaymentTrackerList({
  payments,
  selectedIds,
  visibleColumns,
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
}: PaymentTrackerListProps) {
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const listProps = {
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
  };

  return (
    <Card accentColor="primary" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3">
        <PaymentLogHeader totalPaid={totalPaid} formatCurrency={formatCurrency} columnCustomizer={columnCustomizer} />
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      {viewMode === "cards" ? (
        <div className="space-y-3 p-3">
          <PaymentTrackerListMobile {...listProps} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <PaymentTrackerListTable
            {...listProps}
            visibleColCount={visibleColCount}
            allSelected={allSelected}
            getColumnWidth={getColumnWidth}
            onColumnResize={onColumnResize}
            onToggleAll={onToggleAll}
          />
        </div>
      )}
    </Card>
  );
}
