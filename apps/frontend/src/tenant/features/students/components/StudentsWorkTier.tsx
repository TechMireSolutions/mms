import { useMemo } from "react";
import { motion } from "framer-motion";
import { type Student, type StudentsListPageResult } from "@mms/shared";
import { FilterChips } from "@/components/ui/FilterChips";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentsBulkActionBar } from "@/tenant/features/students/components/StudentsBulkActionBar";
import { StudentsWorkListBody } from "@/tenant/features/students/components/StudentsWorkListBody";
import { StudentsWorkTierToolbar } from "@/tenant/features/students/components/StudentsWorkTierToolbar";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import type { StudentsSelectionTargets } from "@/tenant/features/students/hooks/studentsSelectionTargets";
import { useStudentsWorkOverlays } from "@/tenant/features/students/hooks/useStudentsWorkOverlays";

interface StudentsWorkTierProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  bulkActions: readonly string[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
  workStudents: Student[];
  workPageData: StudentsListPageResult | undefined;
  isWorkPageLoading: boolean;
  isWorkPageError: boolean;
  isWorkPageFetching: boolean;
  useServerWork: boolean;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  selectedIds: string[];
  selectedTargets: StudentsSelectionTargets;
  allSelected: boolean;
  someSelected: boolean;
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearSelection: () => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string, deletionReason?: string) => void | Promise<void>;
  onRestore: (studentId: string) => void | Promise<void>;
  onBulkDelete: (studentIds: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore: (studentIds: string[]) => void | Promise<void>;
  onBulkStatusChange: (studentIds: string[], status: string) => void | Promise<void>;
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onServerSort: (field: StudentListSortField) => void;
}

export function StudentsWorkTier({
  studentSearch,
  studentFilterStatus,
  studentFilterGender,
  studentStatusOptions,
  genderFilters,
  showDeleted,
  canWrite,
  canDelete,
  canExport,
  bulkActions,
  hasActiveFilters,
  activeFilterCount,
  workStudents,
  workPageData,
  isWorkPageLoading,
  isWorkPageError,
  isWorkPageFetching,
  useServerWork,
  viewMode,
  onViewModeChange,
  columnLayout,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onToggleDeleted,
  onClearFilters,
  selectedIds,
  selectedTargets,
  allSelected,
  someSelected,
  onSelectOne,
  onSelectAll,
  onClearSelection,
  onRetry,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
  sortField,
  sortDir,
  onServerSort,
}: StudentsWorkTierProps) {
  const { t } = useTranslation();
  const selectedStudents = useMemo(
    () => workStudents.filter((student) => selectedIds.includes(String(student.id))),
    [workStudents, selectedIds],
  );
  const overlays = useStudentsWorkOverlays({
    selectedStudents,
  });

  const studentFilterChips = [
    ...studentFilterStatus.map((status) => ({
      key: status,
      label: studentStatusLabel(t, status),
      onRemove: () => onToggleStatus(status),
    })),
    ...(studentFilterGender
      ? [
          {
            key: "gender",
            label: formatContactGenderLabel(studentFilterGender, t),
            onRemove: () => onGenderChange(""),
          },
        ]
      : []),
  ];

  return (
    <motion.div
      key="work"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-5"
      aria-busy={useServerWork && isWorkPageFetching ? true : undefined}
    >
      <StudentsWorkTierToolbar
        studentSearch={studentSearch}
        studentFilterStatus={studentFilterStatus}
        studentFilterGender={studentFilterGender}
        studentStatusOptions={studentStatusOptions}
        genderFilters={genderFilters}
        showDeleted={showDeleted}
        canDelete={canDelete}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        columnLayout={columnLayout}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onSearchChange={onSearchChange}
        onToggleStatus={onToggleStatus}
        onGenderChange={onGenderChange}
        onToggleDeleted={onToggleDeleted}
        onClearFilters={onClearFilters}
      />

      <FilterChips chips={studentFilterChips} onClearAll={onClearFilters} />

      <StudentsBulkActionBar
        selectedCount={selectedIds.length}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={overlays.canWriteMessaging}
        canExport={canExport}
        bulkActions={bulkActions}
        selectedTargets={selectedTargets}
        studentStatusOptions={studentStatusOptions}
        statusBadgeConfig={overlays.statusBadgeConfig}
        onWhatsApp={(targets) => overlays.openSelectionMessage("whatsapp", targets)}
        onSms={(targets) => overlays.openSelectionMessage("sms", targets)}
        onEmail={(targets) => overlays.openSelectionMessage("email", targets)}
        onBulkStatusChange={(status) => {
          void onBulkStatusChange(selectedIds, status);
          onClearSelection();
        }}
        onBulkExport={() => {
          void overlays.handleBulkExport();
        }}
        onRequestBulkDelete={() => {
          overlays.setConfirmBulkDeleteOpen(true);
        }}
        onRequestBulkRestore={() => {
          overlays.setConfirmBulkRestoreOpen(true);
        }}
        onClearSelection={onClearSelection}
      />

      <StudentsWorkListBody
        isWorkPageLoading={isWorkPageLoading}
        isWorkPageError={isWorkPageError}
        isWorkPageFetching={isWorkPageFetching}
        onRetry={onRetry}
        workStudents={workStudents}
        workPageData={workPageData}
        useServerWork={useServerWork}
        viewMode={viewMode}
        columnLayout={columnLayout}
        onPageChange={onPageChange}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectOne={onSelectOne}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onShowActive={() => {
          if (showDeleted) onToggleDeleted();
        }}
        sortField={sortField}
        sortDir={sortDir}
        onServerSort={onServerSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        openComposer={overlays.openComposer}
        closeComposer={overlays.closeComposer}
        canWriteMessaging={overlays.canWriteMessaging}
        messagingTarget={overlays.messagingTarget}
        confirmBulkDeleteOpen={overlays.confirmBulkDeleteOpen}
        onConfirmBulkDeleteOpenChange={overlays.setConfirmBulkDeleteOpen}
        confirmBulkRestoreOpen={overlays.confirmBulkRestoreOpen}
        onConfirmBulkRestoreOpenChange={overlays.setConfirmBulkRestoreOpen}
        pendingDeleteId={overlays.pendingDeleteId}
        onPendingDeleteIdChange={overlays.setPendingDeleteId}
      />
    </motion.div>
  );
}
