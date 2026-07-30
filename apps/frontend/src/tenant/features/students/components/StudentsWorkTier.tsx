import { motion } from "framer-motion";
import { ChevronDown, Filter, RotateCcw, Users } from "lucide-react";
import {
  type Student,
  type StudentsListPageResult,
  toTitleCase,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import StudentList from "@/tenant/features/students/components/StudentList";
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
      <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
        <SearchBar
          value={studentSearch}
          onChange={onSearchChange}
          placeholder={t("students.searchPlaceholder")}
          className="flex-1"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
                studentFilterStatus.length > 0
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <Filter className="w-3.5 h-3.5" /> {t("students.columns.status")}
              {studentFilterStatus.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {studentFilterStatus.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">{t("students.filterByStatus")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {studentFilterStatus.length > 0 && (
              <>
                <DropdownMenuItem
                  onClick={onClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
                >
                  <span>{t("students.clearAllFilters")}</span>
                  <RotateCcw className="w-3 h-3 ms-1" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {studentStatusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={studentFilterStatus.includes(status)}
                onCheckedChange={() => onToggleStatus(status)}
              >
                {studentStatusLabel(t, status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
                studentFilterGender
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {studentFilterGender ? toTitleCase(studentFilterGender) : t("students.gender")}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuRadioGroup value={studentFilterGender} onValueChange={onGenderChange}>
              {["", ...genderFilters].map((genderFilter) => (
                <DropdownMenuRadioItem key={genderFilter || "all"} value={genderFilter}>
                  {genderFilter ? toTitleCase(genderFilter) : t("students.allGenders")}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {canDelete && (
          <ModuleTrashToggle
            showDeleted={showDeleted}
            onToggle={onToggleDeleted}
            showActiveLabel={t("students.showActive")}
            showDeletedLabel={t("students.showDeleted")}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
              showDeleted
                ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          />
        )}

        <ModuleColumnCustomizer
          columnRegistry={columnLayout.columnRegistry}
          updateUserColumnLayout={columnLayout.updateUserColumnLayout}
          labels={columnLayout.customizerLabels}
        />
      </div>

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
