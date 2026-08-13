import type React from "react";
import { ShieldCheck } from "lucide-react";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { AttendanceFilters } from "@/tenant/features/attendance/components/AttendanceFilters";
import { AttendanceRecords } from "@/tenant/features/attendance/components/AttendanceRecords";
import { AuditLog } from "@/tenant/features/attendance/components/AuditLog";
import { MarkAttendance } from "@/tenant/features/attendance/components/MarkAttendance";
import type { AttendanceRecord } from "@/lib/data/attendanceData";

type AttendanceWorkTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type AttendanceColumnProps = Pick<
  React.ComponentProps<typeof AttendanceRecords>,
  "isColumnVisible" | "getColumnWidth" | "onColumnResize" | "columnCustomizer"
>;

interface AttendanceWorkTierProps {
  filters: React.ComponentProps<typeof AttendanceFilters>["filters"];
  role: string;
  activeRecords: AttendanceRecord[];
  activeOpsTab: string;
  operationsTabs: AttendanceWorkTab[];
  showDeleted: boolean;
  canDeleteAttendance: boolean;
  showRoleBanner: boolean;
  roleLabel: string;
  teacherRoleText: string | false;
  accountantRoleText: string | false;
  showActiveLabel: string;
  showDeletedLabel: string;
  onFiltersChange: React.ComponentProps<typeof AttendanceFilters>["onChange"];
  onOpsTabChange: (next: string) => void;
  onShowDeletedToggle: () => void;
  onPersistRecords: (recordsForClassDate: AttendanceRecord[]) => Promise<void>;
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRestoreRecord: (id: string) => Promise<void>;
  onBulkDeleteRecords: (ids: string[]) => Promise<void>;
  onBulkRestoreRecords: (ids: string[]) => Promise<void>;
  onMessage: React.ComponentProps<typeof AttendanceRecords>["onMessage"];
  onTotalChange?: (total: number) => void;
  columnProps: AttendanceColumnProps;
}

export function AttendanceWorkTier({
  filters,
  role,
  activeRecords,
  activeOpsTab,
  operationsTabs,
  showDeleted,
  canDeleteAttendance,
  showRoleBanner,
  roleLabel,
  teacherRoleText,
  accountantRoleText,
  showActiveLabel,
  showDeletedLabel,
  onFiltersChange,
  onOpsTabChange,
  onShowDeletedToggle,
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

      {activeOpsTab === "records" && canDeleteAttendance && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={onShowDeletedToggle}
          showActiveLabel={showActiveLabel}
          showDeletedLabel={showDeletedLabel}
          className="min-h-11 border border-border"
        />
      )}

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
          onMessage={onMessage}
          onTotalChange={onTotalChange}
          {...columnProps}
        />
      )}

      {activeOpsTab === "audit" && <AuditLog filters={filters} />}
    </div>
  );
}
