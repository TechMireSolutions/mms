import type React from "react";
import { ShieldCheck } from "lucide-react";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { AttendanceFilters } from "@/tenant/features/attendance/components/AttendanceFilters";
import { AttendanceRecords } from "@/tenant/features/attendance/components/AttendanceRecords";
import { AuditLog } from "@/tenant/features/attendance/components/AuditLog";
import { MarkAttendance } from "@/tenant/features/attendance/components/MarkAttendance";
import type { AttendanceRecord } from "@/lib/data/attendanceData";

export type AttendanceWorkTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type AttendanceColumnProps = Pick<
  React.ComponentProps<typeof AttendanceRecords>,
  "isColumnVisible" | "getColumnWidth" | "onColumnResize" | "columnCustomizer"
>;

export interface AttendanceWorkTierProps {
  showRoleBanner: boolean;
  role: string;
  roleLabel: string;
  teacherRoleText: string | false | null;
  accountantRoleText: string | false | null;
  filters: React.ComponentProps<typeof AttendanceFilters>["filters"];
  onFiltersChange: React.ComponentProps<typeof AttendanceFilters>["onChange"];
  activeOpsTab: string;
  operationsTabs: AttendanceWorkTab[];
  canDeleteAttendance: boolean;
  showDeleted: boolean;
  onShowDeletedToggle: () => void;
  showActiveLabel: string;
  showDeletedLabel: string;
  onOpsTabChange: (tab: string) => void;
  activeRecords: AttendanceRecord[];
  onPersistRecords: (batch: AttendanceRecord[]) => Promise<void>;
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRestoreRecord: (id: string) => Promise<void>;
  onBulkDeleteRecords: (ids: string[]) => Promise<void>;
  onBulkRestoreRecords: (ids: string[]) => Promise<void>;
  onMessage: (channel: 'sms' | 'whatsapp' | 'email', records: AttendanceRecord[]) => void;
  onTotalChange?: (total: number) => void;
  columnProps?: AttendanceColumnProps;
}

export function AttendanceWorkTier({
  showRoleBanner,
  role,
  roleLabel,
  teacherRoleText,
  accountantRoleText,
  filters,
  onFiltersChange,
  activeOpsTab,
  operationsTabs,
  canDeleteAttendance,
  showDeleted,
  onShowDeletedToggle,
  showActiveLabel: _showActiveLabel,
  showDeletedLabel: _showDeletedLabel,
  onOpsTabChange,
  activeRecords,
  onPersistRecords,
  onUpdateRecord,
  onDeleteRecord,
  onRestoreRecord,
  onBulkDeleteRecords,
  onBulkRestoreRecords,
  onMessage,
  onTotalChange,
  columnProps,
}: AttendanceWorkTierProps): React.JSX.Element {
  return (
    <div className="space-y-5">
      {showRoleBanner && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-muted text-muted-foreground border border-border">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-bold capitalize">{roleLabel}</span>
          {teacherRoleText}
          {accountantRoleText}
        </div>
      )}

      <AttendanceFilters filters={filters} onChange={onFiltersChange} />

      {operationsTabs.length > 1 && (
        <SubTabBar
          tabs={operationsTabs.map((tab) => ({ key: tab.id, label: tab.label, icon: tab.icon }))}
          value={activeOpsTab}
          onChange={onOpsTabChange}
        />
      )}

      {activeOpsTab === "mark" && (
        <MarkAttendance
          filters={filters}
          role={role}
          records={activeRecords}
          persistBatch={onPersistRecords}
        />
      )}

      {activeOpsTab === "records" && (
        <AttendanceRecords
          filters={filters}
          onUpdateRecord={onUpdateRecord}
          onDeleteRecord={onDeleteRecord}
          onRestoreRecord={onRestoreRecord}
          onBulkDeleteRecords={onBulkDeleteRecords}
          onBulkRestoreRecords={onBulkRestoreRecords}
          showDeleted={showDeleted}
          onToggleDeleted={onShowDeletedToggle}
          onMessage={onMessage}
          onTotalChange={onTotalChange}
          {...columnProps}
        />
      )}

      {activeOpsTab === "audit" && <AuditLog filters={filters} />}
    </div>
  );
}
