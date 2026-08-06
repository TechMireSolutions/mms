import type { ReactElement } from "react";
import { type Student } from "@mms/shared";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StudentListContent } from "@/tenant/features/students/components/StudentListContent";
import { StudentListConfirmDialogs } from "@/tenant/features/students/components/StudentListConfirmDialogs";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { useStudentListController } from "@/tenant/features/students/hooks/useStudentListController";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  viewMode: WorkDirectoryViewMode;
  isColumnVisible?: (key: string) => boolean;
  columnRegistry?: import("@mms/shared").ModuleColumnRegistryEntry[];
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onServerSort: (field: StudentListSortField) => void;
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearSelection: () => void;
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onShowActive?: () => void;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  closeComposer: () => void;
  canWriteMessaging: boolean;
  messagingTarget: ReturnType<typeof useMessageComposerState>["messagingTarget"];
  confirmBulkDeleteOpen: boolean;
  onConfirmBulkDeleteOpenChange: (open: boolean) => void;
  confirmBulkRestoreOpen: boolean;
  onConfirmBulkRestoreOpenChange: (open: boolean) => void;
  pendingDeleteId: string | null;
  onPendingDeleteIdChange: (id: string | null) => void;
}

/** Students directory content + overlays — bulk bar mounts on WorkTier (Contacts-shaped). */
export default function StudentList({
  students,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  viewMode,
  isColumnVisible,
  columnRegistry = [],
  getColumnWidth,
  onColumnResize,
  sortField,
  sortDir,
  onServerSort,
  selectedIds,
  allSelected,
  someSelected,
  onSelectOne,
  onSelectAll,
  onClearSelection,
  showDeleted = false,
  canWrite = true,
  canDelete = true,
  hasActiveFilters = false,
  onClearFilters,
  onShowActive,
  openComposer,
  closeComposer,
  canWriteMessaging,
  messagingTarget,
  confirmBulkDeleteOpen,
  onConfirmBulkDeleteOpenChange,
  confirmBulkRestoreOpen,
  onConfirmBulkRestoreOpenChange,
  pendingDeleteId,
  onPendingDeleteIdChange,
}: StudentListProps): ReactElement {
  const sessions = useSessionsCollection();
  const list = useStudentListController({
    students,
    onSelectOne,
    onSelectAll,
    allSelected,
    someSelected,
    isColumnVisible,
    sortField,
    sortDir,
    onSort: onServerSort,
    openComposer,
    canWriteMessaging,
  });
  const statusBadgeConfig = studentStatusBadgeConfig(list.t);

  const handleRestore = async (studentId: string): Promise<void> => {
    if (!onRestore) return;
    await onRestore(studentId);
    list.setViewStudent(null);
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
        statusBadgeConfig={statusBadgeConfig}
        isColumnVisible={list.isColumnVisible}
        isFieldEnabled={list.isFieldEnabled}
        columnRegistry={columnRegistry}
        renderSortIcon={list.renderSortIcon}
        onSort={list.handleSort}
        onSelectAll={list.handleSelectAll}
        onSelectOne={list.handleSelectOne}
        onViewStudent={list.setViewStudent}
        onEdit={onEdit}
        onDelete={(studentId) => onPendingDeleteIdChange(studentId)}
        onRestore={onRestore ? handleRestore : undefined}
        onOpenComposer={list.openComposer}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onShowActive={onShowActive}
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

      <StudentListMessageModal messagingTarget={messagingTarget} onClose={closeComposer} />

      <StudentListConfirmDialogs
        pendingDeleteId={pendingDeleteId}
        onPendingDeleteIdChange={onPendingDeleteIdChange}
        confirmBulkDeleteOpen={confirmBulkDeleteOpen}
        onConfirmBulkDeleteOpenChange={onConfirmBulkDeleteOpenChange}
        confirmBulkRestoreOpen={confirmBulkRestoreOpen}
        onConfirmBulkRestoreOpenChange={onConfirmBulkRestoreOpenChange}
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
