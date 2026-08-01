import React, { useState, useMemo } from "react";
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
import { AttendanceRecordsToolbar } from "./AttendanceRecordsToolbar";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";


const PAGE_SIZE = 15;



interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  records: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRestoreRecord: (id: string) => Promise<void>;
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

  const statusLabel = (statusId: string) => {
    const found = statuses.find((status) => status.id === statusId);
    if (found) return found.label;
    const key = `attendance.status.${statusId}` as AppTranslationKey;
    return t(key);
  };

  const visibleColumns = {
    date: isColumnVisible ? isColumnVisible("date") : true,
    class: isColumnVisible ? isColumnVisible("class") : true,
    student: isColumnVisible ? isColumnVisible("student") : true,
    status: isColumnVisible ? isColumnVisible("status") : true,
    timeIn: isColumnVisible ? isColumnVisible("timeIn") : true,
    timeOut: isColumnVisible ? isColumnVisible("timeOut") : true,
    notes: isColumnVisible ? isColumnVisible("notes") : true,
  };

  const visibleColCount = Object.values(visibleColumns).filter(Boolean).length + 1;

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

  const renderRowActions = (attendanceRecord: AttendanceRecord) => (
    <AttendanceRecordRowActions
      attendanceRecord={attendanceRecord}
      editingRecord={editingRecord}
      canWriteAttendance={canWriteAttendance}
      canDeleteAttendance={canDeleteAttendance}
      showDeleted={showDeleted}
      onMessage={onMessage}
      onRestoreRecord={onRestoreRecord}
      setEditingRecord={setEditingRecord}
      setPendingDeleteId={setPendingDeleteId}
      saveEditingRecord={saveEditingRecord}
      t={t}
    />
  );

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
        t={t}
      />

      <AttendanceRecordsTable
        viewMode={viewMode}
        paginatedRecords={paginatedRecords}
        visibleColumns={visibleColumns}
        visibleColCount={visibleColCount}
        editingRecord={editingRecord}
        statuses={statuses}
        updateDraft={updateDraft}
        classLabel={classLabel}
        renderRowActions={renderRowActions}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        t={t}
      />

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
    </section>
  );
}
