import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";

export type DistributionStatus = Distribution["status"];

export const DISTRIBUTION_COLUMN_KEYS = [
  "card",
  "recipient",
  "recipientClass",
  "quantity",
  "reason",
  "issuedDate",
  "issuedBy",
  "status",
] as const;

export interface DistributionManagerListProps {
  viewMode: WorkDirectoryViewMode;
  distributions: Distribution[];
  denoms: Denomination[];
  selectedIds: string[];
  allFilteredSelected: boolean;
  isColumnVisible: (key: string) => boolean;
  statusLabels: Record<DistributionStatus, string>;
  statusConfig: Record<DistributionStatus, StatusBadgeConfigItem>;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canRestoreRows: boolean;
  canDeleteRows: boolean;
  onMessage?: (channel: "sms" | "whatsapp" | "email", distributions: Distribution[]) => void;
  onChangeStatus: (id: string, status: DistributionStatus) => void;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRowTrashAction: (id: string) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function getDistributionDenomination(
  denoms: Denomination[],
  denominationId: string,
): Denomination | undefined {
  return denoms.find((denomination) => denomination.id === denominationId);
}

export function getDistributionStatuses(
  statusConfig: Record<DistributionStatus, StatusBadgeConfigItem>,
): DistributionStatus[] {
  return Object.keys(statusConfig) as DistributionStatus[];
}
