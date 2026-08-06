import { type ReactElement } from "react";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { StudentListContent } from "@/tenant/features/students/components/StudentListContent";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { StudentListSelectionBar } from "@/tenant/features/students/components/StudentListSelectionBar";
import { useStudentListController } from "@/tenant/features/students/hooks/useStudentListController";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import { exportExcel } from "@/components/ui/exportToolbarUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

export interface StudentListServerPagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  viewMode: WorkDirectoryViewMode;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  serverPagination?: StudentListServerPagination;
  serverSort?: {
    sortField: StudentListSortField | null;
    sortDir: "asc" | "desc";
    onSort: (field: StudentListSortField) => void;
  };
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
  serverSort,
  showDeleted = false,
  canWrite = true,
  canDelete = true,
}: StudentListProps): ReactElement {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const list = useStudentListController({
    students,
    showDeleted,
    isColumnVisible,
    serverPagination,
    serverSort,
  });
  const canExport = STUDENTS_MODULE_MANIFEST.work.bulkActions.includes("export");

  const handleRestore = async (studentId: string): Promise<void> => {
    if (!onRestore) return;
    await onRestore(studentId);
    list.setViewStudent(null);
  };

  const handleBulkExport = async () => {
    try {
      await exportExcel({
        title: t("nav.students"),
        filename: "students_export",
        moduleId: "students",
        columns: [
          { header: t("students.columns.name"), key: "name" },
          { header: t("students.columns.grNumber"), key: "grNumber" },
          { header: t("students.columns.gender"), key: "gender" },
          { header: t("students.columns.status"), key: "status" },
          { header: t("students.columns.parents"), key: "fatherName" },
        ],
        rows: list.selectedStudents.map((student) => ({
          name: student.name ?? "",
          grNumber: student.grNumber ?? "",
          gender: student.gender ?? "",
          status: student.status ?? "",
          fatherName: student.fatherName || student.guardianName || "",
        })),
      });
      notify.success(t("students.exportSuccess"));
    } catch {
      notify.error(t("students.exportFailed"));
    }
  };

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
        canWriteMessaging={list.canWriteMessaging}
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
        onDelete={(studentId) => list.setPendingDeleteId(studentId)}
        onRestore={onRestore ? handleRestore : undefined}
        onOpenComposer={list.openComposer}
        onPageChange={list.setCurrentPage}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />

      <StudentListSelectionBar
        selectedIds={list.selectedIds}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={list.canWriteMessaging}
        canExport={canExport}
        studentStatusOptions={list.studentStatusOptions}
        statusBadgeConfig={list.statusBadgeConfig}
        onMessage={list.openSelectionMessage}
        onBulkStatusChange={onBulkStatusChange}
        onBulkExport={() => { void handleBulkExport(); }}
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
        canDelete={canDelete}
        onClose={() => list.setViewStudent(null)}
        onEdit={(student) => {
          list.setViewStudent(null);
          onEdit(student);
        }}
        onRestore={onRestore ? handleRestore : undefined}
      />

      <StudentListMessageModal
        messagingTarget={list.messagingTarget}
        onClose={list.closeComposer}
      />

      <ConfirmAlertDialog
        open={list.pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) list.setPendingDeleteId(null);
        }}
        title={list.t("students.deleteConfirmTitle")}
        description={list.t("students.deleteConfirmDescription")}
        confirmLabel={list.t("students.list.remove")}
        cancelLabel={list.t("common.cancel")}
        destructive
        optionalReason={{
          label: list.t("students.deletionReasonLabel"),
          placeholder: list.t("students.deletionReasonPlaceholder"),
        }}
        onConfirm={(reason) => {
          if (list.pendingDeleteId) onDelete(list.pendingDeleteId, reason);
          list.setPendingDeleteId(null);
        }}
      />

      <ConfirmAlertDialog
        open={list.confirmBulkDeleteOpen}
        onOpenChange={list.setConfirmBulkDeleteOpen}
        title={list.t("students.list.remove")}
        description={list.t("students.list.confirmRemoveSelected", { count: list.selectedIds.length })}
        confirmLabel={list.t("students.list.remove")}
        cancelLabel={list.t("common.cancel")}
        destructive
        optionalReason={{
          label: list.t("students.deletionReasonLabel"),
          placeholder: list.t("students.deletionReasonPlaceholder"),
        }}
        onConfirm={(reason) => {
          onBulkDelete?.(list.selectedIds, reason);
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
