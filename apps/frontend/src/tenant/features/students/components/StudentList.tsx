import { type ReactElement } from "react";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { primaryResponsibleAdultDisplayName, STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { StudentListContent } from "@/tenant/features/students/components/StudentListContent";
import { StudentListConfirmDialogs } from "@/tenant/features/students/components/StudentListConfirmDialogs";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { StudentListSelectionBar } from "@/tenant/features/students/components/StudentListSelectionBar";
import { useStudentListController } from "@/tenant/features/students/hooks/useStudentListController";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import { exportExcel } from "@/components/ui/exportToolbarUtils";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
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
  columnRegistry?: import("@mms/shared").ModuleColumnRegistryEntry[];
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
  columnRegistry = [],
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
          gender: student.gender ? formatContactGenderLabel(student.gender, t) : "",
          status: studentStatusLabel(t, student.status || "active"),
          fatherName: primaryResponsibleAdultDisplayName(student),
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
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={list.canWriteMessaging}
        currentPage={list.currentPage}
        pageSize={list.pageSize}
        hasServerPagination={Boolean(serverPagination)}
        statusBadgeConfig={list.statusBadgeConfig}
        isColumnVisible={list.isColumnVisible}
        isFieldEnabled={list.isFieldEnabled}
        columnRegistry={columnRegistry}
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

      <StudentListConfirmDialogs
        pendingDeleteId={list.pendingDeleteId}
        onPendingDeleteIdChange={list.setPendingDeleteId}
        confirmBulkDeleteOpen={list.confirmBulkDeleteOpen}
        onConfirmBulkDeleteOpenChange={list.setConfirmBulkDeleteOpen}
        confirmBulkRestoreOpen={list.confirmBulkRestoreOpen}
        onConfirmBulkRestoreOpenChange={list.setConfirmBulkRestoreOpen}
        selectedIds={list.selectedIds}
        deleteTitle={list.t("students.deleteConfirmTitle")}
        deleteDescription={list.t("students.deleteConfirmDescription")}
        removeLabel={list.t("students.list.remove")}
        cancelLabel={list.t("common.cancel")}
        deletionReasonLabel={list.t("students.deletionReasonLabel")}
        deletionReasonPlaceholder={list.t("students.deletionReasonPlaceholder")}
        confirmRemoveSelectedDescription={list.t("students.list.confirmRemoveSelected", {
          count: list.selectedIds.length,
        })}
        bulkRestoreTitle={list.t("students.bulkRestore")}
        bulkRestoreDescription={list.t("students.bulkRestoreConfirm", {
          count: list.selectedIds.length,
        })}
        restoreLabel={list.t("students.restore")}
        onDelete={onDelete}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        onClearSelection={() => list.setSelectedIds([])}
      />
    </div>
  );
}
