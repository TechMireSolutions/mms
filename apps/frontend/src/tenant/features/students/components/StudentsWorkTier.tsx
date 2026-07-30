import { motion } from "framer-motion";
import { toTitleCase, type Student, type StudentsListPageResult } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import StudentList from "@/tenant/features/students/components/StudentList";
import { StudentsWorkTierToolbar } from "@/tenant/features/students/components/StudentsWorkTierToolbar";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";

interface StudentsWorkTierProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  workStudents: Student[];
  workPageData: StudentsListPageResult | undefined;
  isWorkPageLoading: boolean;
  isWorkPageError: boolean;
  isWorkPageFetching: boolean;
  useServerWork: boolean;
  isListView: boolean;
  workLimit: number;
  shownCount: number;
  workTruncated: boolean;
  defaultViewLayout: string | undefined;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onRestore: (studentId: string) => void;
  onBulkDelete: (studentIds: string[]) => void;
  onBulkRestore: (studentIds: string[]) => void;
  onBulkStatusChange: (studentIds: string[], status: string) => void;
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
  workStudents,
  workPageData,
  isWorkPageLoading,
  isWorkPageError,
  isWorkPageFetching,
  useServerWork,
  isListView,
  workLimit,
  shownCount,
  workTruncated,
  defaultViewLayout,
  columnLayout,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onToggleDeleted,
  onClearFilters,
  onRetry,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
}: StudentsWorkTierProps) {
  const { t } = useTranslation();
  const studentFilterChips = [
    ...studentFilterStatus.map((status) => ({
      key: status,
      label: studentStatusLabel(t, status),
      onRemove: () => onToggleStatus(status),
    })),
    ...(studentFilterGender
      ? [{ key: "gender", label: toTitleCase(studentFilterGender), onRemove: () => onGenderChange("") }]
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
    >
      <StudentsWorkTierToolbar
        studentSearch={studentSearch}
        studentFilterStatus={studentFilterStatus}
        studentFilterGender={studentFilterGender}
        studentStatusOptions={studentStatusOptions}
        genderFilters={genderFilters}
        showDeleted={showDeleted}
        canDelete={canDelete}
        columnLayout={columnLayout}
        onSearchChange={onSearchChange}
        onToggleStatus={onToggleStatus}
        onGenderChange={onGenderChange}
        onToggleDeleted={onToggleDeleted}
        onClearFilters={onClearFilters}
      />

      <FilterChips chips={studentFilterChips} onClearAll={onClearFilters} />

      {workTruncated && (
        <p className="text-xs text-muted-foreground px-1">
          {t("students.workTruncated", {
            limit: workLimit,
            total: shownCount,
          })}
        </p>
      )}

      <ErrorBoundary>
        {isWorkPageLoading ? (
          <TableSkeleton rows={6} cols={columnLayout.columnRegistry.length} />
        ) : isWorkPageError ? (
          <ErrorState title={t("students.loadFailed")} onRetry={onRetry} />
        ) : (
          <>
            <StudentList
              students={workStudents}
              layout={defaultViewLayout}
              isColumnVisible={columnLayout.isColumnVisible}
              getColumnWidth={columnLayout.getColumnWidth}
              onColumnResize={columnLayout.setColumnWidth}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              serverPagination={
                isListView && workPageData && !showDeleted
                  ? {
                      total: workPageData.total,
                      page: workPageData.page,
                      limit: workPageData.limit,
                      hasMore: workPageData.hasMore,
                    }
                  : undefined
              }
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              onBulkDelete={onBulkDelete}
              onBulkRestore={onBulkRestore}
              onBulkStatusChange={onBulkStatusChange}
            />
            {useServerWork && isListView && workPageData && !showDeleted && (
              <ListPagination
                page={workPageData.page}
                total={workPageData.total}
                limit={workPageData.limit}
                hasMore={workPageData.hasMore}
                onPageChange={onPageChange}
                i18nNamespace="students"
                variant="range"
              />
            )}
            {useServerWork && isWorkPageFetching && (
              <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
            )}
          </>
        )}
      </ErrorBoundary>
    </motion.div>
  );
}
