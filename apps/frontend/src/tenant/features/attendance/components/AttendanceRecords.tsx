import React, { useState, useMemo, useEffect } from "react";
import { ListPagination } from "@/components/ui/ListPagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { AttendanceRecord } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ATTENDANCE_MODULE_MANIFEST, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { notify } from "@/lib/notify";
import { AttendanceRecordRowActions } from "./AttendanceRecordRowActions";
import { AttendanceRecordsTable } from "./AttendanceRecordsTable";
import { AttendanceRecordsMobileList } from "./AttendanceRecordsMobileList";
import { AttendanceRecordsToolbar } from "./AttendanceRecordsToolbar";
import { AttendanceBulkActionBar } from "./AttendanceBulkActionBar";
import { useAttendanceSelection } from "@/tenant/features/attendance/hooks/useAttendanceSelection";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";


const PAGE_SIZE = 15;
const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;
const ATTENDANCE_COLUMN_KEYS = ["date", "class", "student", "status", "timeIn", "timeOut", "notes"] as const;



interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  records: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRestoreRecord: (id: string) => Promise<void>;
  onBulkDeleteRecords: (ids: string[]) => Promise<void>;
  onBulkRestoreRecords: (ids: string[]) => Promise<void>;
  showDeleted?: boolean;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', records: AttendanceRecord[]) => void;
}

export function AttendanceRecords({
  filters,
  records,
  onUpdateRecord,
  onDeleteRecord,
  onRestoreRecord,
  onBulkDeleteRecords,
  onBulkRestoreRecords,
  showDeleted = false,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
}: AttendanceRecordsProps) {
  const { statuses } = useAttendanceConfig();
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const {
    canWrite: canWriteAttendance,
    canDelete: canDeleteAttendance,
  } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const sessions = useSessionsCollection();

  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const baseFiltered = useMemo(() => {
    return records.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (statusFilter !== "all" && attendanceRecord.status !== statusFilter) return false;
      if (dateFrom && attendanceRecord.date < dateFrom) return false;
      if (dateTo && attendanceRecord.date > dateTo) return false;
      return true;
    });
  }, [records, filters, statusFilter, dateFrom, dateTo]);

  const {
    searchQuery: search,
    currentPage: page,
    setCurrentPage: setPage,
    handleSearchChange,
    paginatedItems: paginatedRecords,
    filteredItems: filtered,
  } = useLocalPagination({
    items: baseFiltered,
    pageSize: PAGE_SIZE,
    searchFields: (attendanceRecord) => [attendanceRecord.studentName],
  });

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedRecord,
    clearSelection,
  } = useAttendanceSelection(filtered);

  useEffect(() => {
    clearSelection();
  }, [showDeleted, clearSelection]);

  const statusLabel = (statusId: string) => {
    const found = statuses.find((status) => status.id === statusId);
    if (found) return found.label;
    const key = `attendance.status.${statusId}` as AppTranslationKey;
    return t(key);
  };

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;
  const visibleColCount = ATTENDANCE_COLUMN_KEYS.filter(columnVisible).length + (canDeleteAttendance ? 1 : 0) + 1;

  const updateDraft = <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => {
    setEditingRecord((current) => current ? { ...current, [key]: value } : current);
  };

  const saveEditingRecord = async () => {
    if (!editingRecord || !canWriteAttendance) return;
    try {
      await onUpdateRecord(editingRecord);
      notify.success(t("attendance.toast.updated"));
      setEditingRecord(null);
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const classLabel = (classId: string) => allClasses.find((sessionClass) => sessionClass.id === classId)?.name || classId;

  const createRowActionsRenderer = (variant: 'table' | 'cards') =>
    (attendanceRecord: AttendanceRecord) => (
      <AttendanceRecordRowActions
        attendanceRecord={attendanceRecord}
        editingRecord={editingRecord}
        canWriteAttendance={canWriteAttendance}
        canDeleteAttendance={canDeleteAttendance}
        showDeleted={showDeleted}
        variant={variant}
        onMessage={onMessage}
        onRestoreRecord={onRestoreRecord}
        setEditingRecord={setEditingRecord}
        setPendingDeleteId={setPendingDeleteId}
        saveEditingRecord={saveEditingRecord}
        t={t}
      />
    );

  const renderRowActions = createRowActionsRenderer('table');
  const renderRowActionsCards = createRowActionsRenderer('cards');

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestoreRecords(selectedIds);
    else void onBulkDeleteRecords(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  return (
    <section className="space-y-4">
      <AttendanceRecordsToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        handleSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statuses={statuses}
        statusLabel={statusLabel}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        setPage={setPage}
        columnCustomizer={columnCustomizer}
      />

      {canDeleteAttendance ? (
        <AttendanceBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDeleteAttendance}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={() => setSelectedIds([])}
        />
      ) : null}

      {viewMode === "cards" ? (
        <AttendanceRecordsMobileList
          paginatedRecords={paginatedRecords}
          isColumnVisible={columnVisible}
          editingRecord={editingRecord}
          statuses={statuses}
          updateDraft={updateDraft}
          classLabel={classLabel}
          renderRowActions={renderRowActionsCards}
          selectedIds={selectedIds}
          canDelete={canDeleteAttendance}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectedRecord={toggleSelectedRecord}
          t={t}
        />
      ) : (
        <AttendanceRecordsTable
          paginatedRecords={paginatedRecords}
          isColumnVisible={columnVisible}
          visibleColCount={visibleColCount}
          editingRecord={editingRecord}
          statuses={statuses}
          updateDraft={updateDraft}
          classLabel={classLabel}
          renderRowActions={renderRowActions}
          selectedIds={selectedIds}
          canDelete={canDeleteAttendance}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectedRecord={toggleSelectedRecord}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          t={t}
        />
      )}

      <ListPagination
        page={page}
        total={filtered.length}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        i18nNamespace="attendance"
        variant="summary"
      />
      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("attendance.confirmArchiveTitle")}
        description={t("attendance.confirmArchiveDescription")}
        confirmLabel={t("attendance.archive")}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) void onDeleteRecord(id);
        }}
        destructive
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t("attendance.trash.restore") : t("attendance.confirmArchiveTitle")}
        description={t(showDeleted ? "attendance.trash.bulkRestoreConfirm" : "attendance.trash.bulkDeleteConfirm", { count: selectedIds.length })}
        confirmLabel={showDeleted ? t("attendance.trash.restore") : t("common.delete")}
        onConfirm={confirmBulkTrash}
        destructive={!showDeleted}
      />
    </section>
  );
}
