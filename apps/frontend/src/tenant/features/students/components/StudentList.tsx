import { type ReactElement } from "react";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import {
  primaryResponsibleAdultDisplayName,
  STUDENTS_MODULE_MANIFEST,
  type Student,
} from "@mms/shared";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { StudentListContent } from "@/tenant/features/students/components/StudentListContent";
import { StudentListConfirmDialogs } from "@/tenant/features/students/components/StudentListConfirmDialogs";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { StudentListSelectionBar } from "@/tenant/features/students/components/StudentListSelectionBar";
import { useStudentListController } from "@/tenant/features/students/hooks/useStudentListController";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import type { StudentsSelectionTargets } from "@/tenant/features/students/hooks/studentsSelectionTargets";
import { exportExcel } from "@/components/ui/exportToolbarUtils";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

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
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onServerSort: (field: StudentListSortField) => void;
  selectedIds: string[];
  selectedTargets: StudentsSelectionTargets;
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearSelection: () => void;
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  bulkActions?: readonly string[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onShowActive?: () => void;
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
  sortField,
  sortDir,
  onServerSort,
  selectedIds,
  selectedTargets,
  onSelectOne,
  onSelectAll,
  onClearSelection,
  showDeleted = false,
  canWrite = true,
  canDelete = true,
  canExport = false,
  bulkActions = STUDENTS_MODULE_MANIFEST.work.bulkActions,
  hasActiveFilters = false,
  onClearFilters,
  onShowActive,
}: StudentListProps): ReactElement {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const list = useStudentListController({
    students,
    selectedIds,
    onSelectOne,
    onSelectAll,
    isColumnVisible,
    sortField,
    sortDir,
    onSort: onServerSort,
  });

  const selectedStudents = students.filter((student) =>
    selectedIds.includes(String(student.id)),
  );

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
        rows: selectedStudents.map((student) => ({
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
        selectedIds={selectedIds}
        allSelected={list.allSelected}
        someSelected={list.someSelected}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={list.canWriteMessaging}
        statusBadgeConfig={list.statusBadgeConfig}
        isColumnVisible={list.isColumnVisible}
        isFieldEnabled={list.isFieldEnabled}
        columnRegistry={columnRegistry}
        renderSortIcon={list.renderSortIcon}
        onSort={list.handleSort}
        onSelectAll={list.handleSelectAll}
        onSelectOne={list.handleSelectOne}
        onViewStudent={list.setViewStudent}
        onEdit={onEdit}
        onDelete={(studentId) => list.setPendingDeleteId(studentId)}
        onRestore={onRestore ? handleRestore : undefined}
        onOpenComposer={list.openComposer}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onShowActive={onShowActive}
      />

      {selectedIds.length > 0 ? (
        <StudentListSelectionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          canWriteMessaging={list.canWriteMessaging}
          canExport={canExport}
          bulkActions={bulkActions}
          selectedTargets={selectedTargets}
          studentStatusOptions={list.studentStatusOptions}
          statusBadgeConfig={list.statusBadgeConfig}
          onWhatsApp={(targets) => list.openSelectionMessage("whatsapp", targets)}
          onSms={(targets) => list.openSelectionMessage("sms", targets)}
          onEmail={(targets) => list.openSelectionMessage("email", targets)}
          onBulkStatusChange={
            onBulkStatusChange
              ? (status) => {
                  void onBulkStatusChange(selectedIds, status);
                  onClearSelection();
                }
              : undefined
          }
          onBulkExport={() => {
            void handleBulkExport();
          }}
          onRequestBulkDelete={() => {
            if (onBulkDelete) list.setConfirmBulkDeleteOpen(true);
          }}
          onRequestBulkRestore={() => {
            if (onBulkRestore) list.setConfirmBulkRestoreOpen(true);
          }}
          onClearSelection={onClearSelection}
        />
      ) : null}

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
        selectedIds={selectedIds}
        deleteTitle={list.t("students.deleteConfirmTitle")}
        deleteDescription={list.t("students.deleteConfirmDescription")}
        removeLabel={list.t("students.list.remove")}
        cancelLabel={list.t("common.cancel")}
        deletionReasonLabel={list.t("students.deletionReasonLabel")}
        deletionReasonPlaceholder={list.t("students.deletionReasonPlaceholder")}
        confirmRemoveSelectedDescription={list.t("students.list.confirmRemoveSelected", {
          count: selectedIds.length,
        })}
        bulkRestoreTitle={list.t("students.bulkRestore")}
        bulkRestoreDescription={list.t("students.bulkRestoreConfirm", {
          count: selectedIds.length,
        })}
        restoreLabel={list.t("students.restore")}
        onDelete={onDelete}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        onClearSelection={onClearSelection}
      />
    </div>
  );
}
