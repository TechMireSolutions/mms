import { motion, AnimatePresence } from "framer-motion";
import type { Student, StudentsListPageResult } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton, CardSkeleton } from "@/components/ui/LoadingState";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import StudentList from "@/tenant/features/students/components/StudentList";
import type { StudentListProps } from "@/tenant/features/students/components/StudentList";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";

export interface StudentsWorkListBodyProps
  extends Omit<
    StudentListProps,
    "students" | "viewMode" | "isColumnVisible" | "columnRegistry" | "getColumnWidth" | "onColumnResize"
  > {
  isWorkPageLoading: boolean;
  isWorkPageError: boolean;
  isWorkPageFetching: boolean;
  onRetry: () => void;
  workStudents: Student[];
  workPageData: StudentsListPageResult | undefined;
  useServerWork: boolean;
  viewMode: WorkDirectoryViewMode;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  onPageChange: (page: number) => void;
}

/** Loading / error / directory / pagination — Contacts WorkListBody analogue. */
export function StudentsWorkListBody({
  isWorkPageLoading,
  isWorkPageError,
  isWorkPageFetching,
  onRetry,
  workStudents,
  workPageData,
  useServerWork,
  viewMode,
  columnLayout,
  onPageChange,
  ...listProps
}: StudentsWorkListBodyProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence mode="wait">
      {isWorkPageError ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ErrorState
            title={t("students.loadFailed")}
            description={t("students.loadFailedHint")}
            onRetry={onRetry}
          />
        </motion.div>
      ) : isWorkPageLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-busy="true"
          role="status"
          aria-live="polite"
        >
          {viewMode === "cards" ? (
            <CardSkeleton count={6} className="grid-cols-1 sm:grid-cols-2" />
          ) : (
            <TableSkeleton rows={6} cols={columnLayout.columnRegistry.length} />
          )}
          <span className="sr-only">{t("common.loading")}</span>
        </motion.div>
      ) : (
        <motion.div
          key="list-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          aria-busy={useServerWork && isWorkPageFetching ? true : undefined}
        >
          <ErrorBoundary>
            <StudentList
              students={workStudents}
              viewMode={viewMode}
              isColumnVisible={columnLayout.isColumnVisible}
              columnRegistry={columnLayout.columnRegistry}
              getColumnWidth={columnLayout.getColumnWidth}
              onColumnResize={columnLayout.setColumnWidth}
              {...listProps}
            />
            {useServerWork && workPageData && workStudents.length > 0 ? (
              <ListPagination
                page={workPageData.page}
                total={workPageData.total}
                limit={workPageData.limit}
                hasMore={workPageData.hasMore}
                onPageChange={onPageChange}
                i18nNamespace="students"
                variant="range"
              />
            ) : null}
            {useServerWork && isWorkPageFetching ? (
              <p className="text-xs text-muted-foreground px-1" role="status" aria-live="polite">
                {t("common.loading")}
              </p>
            ) : null}
          </ErrorBoundary>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
