import { type ReactElement } from "react";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { type Student } from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { StudentListContent } from "@/tenant/features/students/components/StudentListContent";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { StudentListSelectionBar } from "@/tenant/features/students/components/StudentListSelectionBar";
import { useStudentListController } from "@/tenant/features/students/hooks/useStudentListController";

export interface StudentListServerPagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  viewMode: WorkDirectoryViewMode;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  serverPagination?: StudentListServerPagination;
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}

export default function StudentList({
  students,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
  viewMode,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  serverPagination,
  showDeleted = false,
  canWrite = true,
  canDelete = true,
}: StudentListProps): ReactElement {
  const sessions = useSessionsCollection();
  const list = useStudentListController({ students, showDeleted, isColumnVisible, serverPagination });

  return (
    <div className="space-y-4">
      <StudentListContent
        students={students}
        paginatedStudents={list.paginatedStudents}
        sessions={sessions}
        viewMode={viewMode}
        selectedIds={list.selectedIds}
        allSelected={list.allSelected}
        someSelected={list.someSelected}
        showDob={list.showDob}
        showParents={list.showParents}
        showSessions={list.showSessions}
        showStatus={list.showStatus}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        currentPage={list.currentPage}
        pageSize={list.pageSize}
        hasServerPagination={Boolean(serverPagination)}
        statusBadgeConfig={list.statusBadgeConfig}
        isFieldEnabled={list.isFieldEnabled}
        renderSortIcon={list.renderSortIcon}
        onSort={list.handleSort}
        onSelectAll={list.handleSelectAll}
        onSelectOne={list.handleSelectOne}
        onRowClick={list.handleRowClick}
        onViewStudent={list.setViewStudent}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onOpenComposer={list.openComposer}
        onPageChange={list.setCurrentPage}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />

      <StudentListSelectionBar
        selectedIds={list.selectedIds}
        selectedStudents={list.selectedStudents}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        studentStatusOptions={list.studentStatusOptions}
        statusBadgeConfig={list.statusBadgeConfig}
        onOpenComposer={list.openComposer}
        onBulkStatusChange={onBulkStatusChange}
        onRequestBulkDelete={() => {
          if (onBulkDelete) list.setConfirmBulkDeleteOpen(true);
        }}
        onRequestBulkRestore={() => {
          if (onBulkRestore) list.setConfirmBulkRestoreOpen(true);
        }}
        onClearSelection={() => list.setSelectedIds([])}
      />

      <StudentListProfileDrawer
        student={list.viewStudent}
        canWrite={canWrite}
        onClose={() => list.setViewStudent(null)}
        onEdit={(student) => {
          list.setViewStudent(null);
          onEdit(student);
        }}
      />

      <StudentListMessageModal
        messagingTarget={list.messagingTarget}
        onClose={list.closeComposer}
      />

      <ConfirmAlertDialog
        open={list.confirmBulkDeleteOpen}
        onOpenChange={list.setConfirmBulkDeleteOpen}
        title={list.t("students.list.remove")}
        description={list.t("students.list.confirmRemoveSelected", { count: list.selectedIds.length })}
        confirmLabel={list.t("students.list.remove")}
        cancelLabel={list.t("common.cancel")}
        onConfirm={() => {
          onBulkDelete?.(list.selectedIds);
          list.setSelectedIds([]);
          list.setConfirmBulkDeleteOpen(false);
        }}
      />

      <ConfirmAlertDialog
        open={list.confirmBulkRestoreOpen}
        onOpenChange={list.setConfirmBulkRestoreOpen}
        title={list.t("students.bulkRestore")}
        description={list.t("students.bulkRestoreConfirm", { count: list.selectedIds.length })}
        confirmLabel={list.t("students.restore")}
        cancelLabel={list.t("common.cancel")}
        onConfirm={() => {
          onBulkRestore?.(list.selectedIds);
          list.setSelectedIds([]);
          list.setConfirmBulkRestoreOpen(false);
        }}
      />
    </div>
  );
}
