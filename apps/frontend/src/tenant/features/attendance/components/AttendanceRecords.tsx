import React, { useState, useEffect, useDeferredValue } from "react";
import { ListPagination } from "@/components/ui/ListPagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { type AttendanceRecord } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ATTENDANCE_MODULE_MANIFEST, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { type AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { notify } from "@/lib/notify";
import { AttendanceRecordRowActions } from "./AttendanceRecordRowActions";
import { AttendanceListContent } from "./AttendanceListContent";
import { AttendanceListFilters } from "./AttendanceListFilters";
import { AttendanceBulkActionBar } from "./AttendanceBulkActionBar";
import { AttendanceRecordsConfirmDialogs } from "./AttendanceRecordsConfirmDialogs";
import { useAttendanceSelection } from "@/tenant/features/attendance/hooks/useAttendanceSelection";
import { useAttendancePaginated } from "@/tenant/features/attendance/hooks/useAttendance";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";


const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;
const ATTENDANCE_COLUMN_KEYS = ["date", "class", "session", "student", "status", "timeIn", "timeOut", "notes"] as const;
const ATTENDANCE_SEARCH_DEBOUNCE_MS = 300;



export interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRestoreRecord: (id: string) => Promise<void>;
  onBulkDeleteRecords: (ids: string[]) => Promise<void>;
  onBulkRestoreRecords: (ids: string[]) => Promise<void>;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', records: AttendanceRecord[]) => void;
  /** Reports the server-filtered total up to the page metrics strip. */
  onTotalChange?: (total: number) => void;
}

export function AttendanceRecords({
  filters,
  onUpdateRecord,
  onDeleteRecord,
  onRestoreRecord,
  onBulkDeleteRecords,
  onBulkRestoreRecords,
  showDeleted = false,
  onToggleDeleted,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
  onTotalChange,
}: AttendanceRecordsProps): React.JSX.Element {
  const { statuses } = useAttendanceConfig();
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const {
    canWrite: canWriteAttendance,
    canDelete: canDeleteAttendance,
  } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const sessions = useSessionsCollection();

  const allClasses = (() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  })();

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [listPage, setListPage] = useState(1);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, ATTENDANCE_SEARCH_DEBOUNCE_MS);
  const deferredSearch = useDeferredValue(debouncedSearch);

  // Server-side filter/page reset whenever a filter dimension changes.
  useEffect(() => {
    setListPage(1);
  }, [deferredSearch, statusFilter, dateFrom, dateTo, filters.sessionId, filters.classId, filters.teacherId, filters.date, showDeleted]);

  const attendancePageQuery = useAttendancePaginated({
    page: listPage,
    limit: ATTENDANCE_MODULE_MANIFEST.defaultPageSize,
    search: deferredSearch,
    sessionId: filters.sessionId,
    classId: filters.classId,
    teacherId: filters.teacherId,
    date: filters.date,
    status: statusFilter !== "all" ? statusFilter : undefined,
    dateFrom,
    dateTo,
    includeDeleted: showDeleted,
  });

  const pageRecords = attendancePageQuery.data?.records ?? [];
  const serverTotal = attendancePageQuery.data?.total ?? 0;
  const serverPage = attendancePageQuery.data?.page ?? listPage;
  const serverLimit = attendancePageQuery.data?.limit ?? ATTENDANCE_MODULE_MANIFEST.defaultPageSize;
  const serverHasMore = attendancePageQuery.data?.hasMore ?? false;

  useEffect(() => {
    onTotalChange?.(serverTotal);
  }, [onTotalChange, serverTotal]);

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedRecord,
    clearSelection,
  } = useAttendanceSelection(pageRecords);

  useEffect(() => {
    clearSelection();
  }, [showDeleted, listPage, debouncedSearch, statusFilter, dateFrom, dateTo, filters.sessionId, filters.classId, filters.teacherId, filters.date, clearSelection]);

  const statusMap = (() => {
    const map = new Map<string, (typeof statuses)[number]>();
    for (const s of statuses) {
      if (s?.id != null) map.set(s.id, s);
    }
    return map;
  })();

  const statusLabel = (statusId: string) => {
    const found = statusMap.get(statusId);
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

  const classMap = (() => {
    const map = new Map<string, string>();
    for (const c of allClasses) {
      if (c?.id != null && c.name) map.set(c.id, c.name);
    }
    return map;
  })();

  const classLabel = (classId: string) => classMap.get(classId) || classId;

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

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
    <section className="space-y-4" aria-busy={attendancePageQuery.isFetching}>
      <AttendanceListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={searchInput}
        handleSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statuses={statuses}
        statusLabel={statusLabel}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        setPage={setListPage}
        canDelete={canDeleteAttendance}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleDeleted}
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

      {attendancePageQuery.isError ? (
        <ErrorState
          title={t("attendance.toast.loadFailed")}
          description={t("attendance.loadFailedHint")}
          onRetry={() => { void attendancePageQuery.refetch(); }}
        />
      ) : (
        <AttendanceListContent
          viewMode={viewMode}
          paginatedRecords={pageRecords}
          isColumnVisible={columnVisible}
          visibleColCount={visibleColCount}
          editingRecord={editingRecord}
          statuses={statuses}
          updateDraft={updateDraft}
          classLabel={classLabel}
          renderRowActions={renderRowActions}
          renderRowActionsCards={renderRowActionsCards}
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
        page={serverPage}
        total={serverTotal}
        limit={serverLimit}
        hasMore={serverHasMore}
        onPageChange={setListPage}
        i18nNamespace="attendance"
        variant="summary"
      />
      <AttendanceRecordsConfirmDialogs
        pendingDeleteId={pendingDeleteId}
        onPendingDeleteChange={setPendingDeleteId}
        onConfirmDelete={(id) => void onDeleteRecord(id)}
        confirmBulkOpen={confirmBulkOpen}
        onConfirmBulkOpenChange={setConfirmBulkOpen}
        showDeleted={showDeleted}
        selectedIdsCount={selectedIds.length}
        onConfirmBulkTrash={confirmBulkTrash}
        t={t}
      />
    </section>
  );
}
