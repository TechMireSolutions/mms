import type { StandardMessagingRecipient } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Invoice } from "@/lib/data/financeData";
import type { InvoiceMessageChannel } from "@/tenant/features/finance/components/InvoiceListRowActions";

export interface InvoiceListVisibleColumns {
  invoice: boolean;
  student: boolean;
  sessionClass: boolean;
  baseFee: boolean;
  discount: boolean;
  final: boolean;
  status: boolean;
  dueDate: boolean;
}

export interface InvoiceListContentProps {
  invoices: Invoice[];
  selectedIds: string[];
  visibleColumns: InvoiceListVisibleColumns;
  visibleColCount: number;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging: boolean;
  showDeleted: boolean;
  allSelected: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  onRequestDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: InvoiceMessageChannel, recipients: StandardMessagingRecipient[]) => void;
}
