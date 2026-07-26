import React, { useState, useMemo, useEffect } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, GraduationCap, Filter, ChevronDown, Users, RotateCcw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import StudentList from "@/tenant/features/students/components/StudentList";
import StudentForm from "@/tenant/features/students/components/StudentForm";
import StudentsSettingsPanel from "@/tenant/features/students/components/StudentsSettings";
import { type Student, STUDENTS_MODULE_CONTRACT, toTitleCase, type AppTranslationKey } from "@mms/shared";


import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import { useStudentCount } from "@/tenant/features/students/hooks/useStudentCount";
import { useStudentsPaginated, useStudentMutations, type StudentRecord } from "@/tenant/features/students/hooks/useStudents";
import { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useGrMigration } from "@/tenant/features/students/hooks/useGrMigration";

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Work | Reports | Setup).
 */
export default function Students() {
  const { t } = useTranslation();
  const {
    canWrite,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(STUDENTS_MODULE_CONTRACT);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });
  const { data: serverCount } = useStudentCount();
  const { createStudent, updateStudent, deleteStudent, bulkDeleteStudents, bulkUpdateStudentStatus } = useStudentMutations();
  const { settings, statuses: studentStatusOptions, genderFilters } = useStudentConfig();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("students_active_tab", "work");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [listPage, setListPage] = useState(1);

  useGrMigration(settings, updateStudent, activeTab);

  const {
    columnRegistry,
    isColumnVisible,
    updateUserColumnLayout,
    customizerLabels,
  } = useStudentColumnLayout(settings);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  // Global Keyboard Shortcuts (Cmd+N to add student)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        if (canWrite) {
          e.preventDefault();
          setEditStudent(null);
          setShowStudentForm(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWrite]);

  const useServerWork = activeTab === "work";
  const isListView = settings.defaultViewLayout === "list";
  const workLimit = isListView
    ? STUDENTS_MODULE_CONTRACT.defaultPageSize
    : STUDENTS_MODULE_CONTRACT.maxPageSize;

  const { data: workPageData, isFetching: isWorkPageFetching, isLoading: isWorkPageLoading } = useStudentsPaginated({
    page: isListView ? listPage : 1,
    limit: workLimit,
    search: studentSearch,
    status: studentFilterStatus.length > 0 ? studentFilterStatus.join(",") : undefined,
    gender: studentFilterGender || undefined,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
  }, [studentSearch, studentFilterStatus, studentFilterGender, settings.defaultViewLayout]);

  const workStudents = useMemo(
    () => (workPageData?.students ?? []) as Student[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? 0;
  const workTruncated = useServerWork && !isListView && Boolean(workPageData?.hasMore);

  const handleSaveStudent = async (studentToSave: Student) => {
    if (editStudent) {
      await updateStudent.mutateAsync({
        id: String(studentToSave.id),
        student: studentToSave as StudentRecord,
      });
    } else {
      await createStudent.mutateAsync(studentToSave as StudentRecord);
    }
  };

  const toggleStudentStatus = (status: string) =>
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  const studentFilterChips = [
    ...studentFilterStatus.map((status) => ({
      key: status,
      label: t(`students.form.status.${status}` as AppTranslationKey) || toTitleCase(status),
      onRemove: () => toggleStudentStatus(status),
    })),
    ...(studentFilterGender
      ? [{ key: "gender", label: toTitleCase(studentFilterGender), onRemove: () => setStudentFilterGender("") }]
      : []),
  ];

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.students")}`}
      seoDescription={t("page.students.subtitle")}
      headerIcon={GraduationCap}
      headerTitle={t("nav.students")}
      headerSubtitle={
        serverCount != null
          ? `${t("page.students.subtitle")} · ${serverCount} ${t("nav.students").toLowerCase()}`
          : t("page.students.subtitle")
      }
      headerActions={
        canWrite ? (
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={() => { setEditStudent(null); setShowStudentForm(true); }}
          >
            {t("action.addStudent")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <StudentsCommandMetrics total={serverCount ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="students-tab"
      >
      <AnimatePresence mode="wait">
        {activeTab === "work" ? (
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
                onChange={setStudentSearch}
                placeholder={t("students.searchPlaceholder")}
                className="flex-1"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                      studentFilterStatus.length > 0
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" /> {t("students.columns.status")}
                    {studentFilterStatus.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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
                        onClick={() => setStudentFilterStatus([])}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
                      >
                        <span>Clear All</span>
                        <RotateCcw className="w-3 h-3 ms-1" />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {studentStatusOptions.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={studentFilterStatus.includes(status)}
                      onCheckedChange={() => toggleStudentStatus(status)}
                    >
                      {t(`students.form.status.${status}` as AppTranslationKey) || toTitleCase(status)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                      studentFilterGender
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {studentFilterGender
                      ? toTitleCase(studentFilterGender)
                      : t("students.gender")}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {["", ...genderFilters].map((genderFilter) => (
                    <DropdownMenuCheckboxItem
                       key={genderFilter}
                       checked={studentFilterGender === genderFilter}
                       onCheckedChange={() => setStudentFilterGender(genderFilter)}
                     >
                       {genderFilter ? toTitleCase(genderFilter) : t("students.allGenders")}
                     </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ModuleColumnCustomizer
                columnRegistry={columnRegistry}
                updateUserColumnLayout={updateUserColumnLayout}
                labels={customizerLabels}
              />
            </div>

            <FilterChips
              chips={studentFilterChips}
              onClearAll={() => {
                setStudentFilterStatus([]);
                setStudentFilterGender("");
              }}
            />

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
                <TableSkeleton rows={6} cols={columnRegistry.length} />
              ) : (
                <>
                  <StudentList
                    students={workStudents}
                    layout={settings.defaultViewLayout}
                    isColumnVisible={isColumnVisible}
                    serverPagination={
                      isListView && workPageData
                        ? {
                            total: workPageData.total,
                            page: workPageData.page,
                            limit: workPageData.limit,
                            hasMore: workPageData.hasMore,
                          }
                        : undefined
                    }
                    onEdit={(studentToEdit: Student) => { setEditStudent(studentToEdit); setShowStudentForm(true); }}
                    onDelete={(studentId: string) => deleteStudent.mutate(String(studentId))}
                    onBulkDelete={(studentIds) => bulkDeleteStudents.mutate(studentIds.map(String))}
                    onBulkStatusChange={(studentIds, status) => bulkUpdateStudentStatus.mutate({ ids: studentIds.map(String), status })}
                  />
                  {useServerWork && isListView && workPageData && (
                    <ListPagination
                      page={workPageData.page}
                      total={workPageData.total}
                      limit={workPageData.limit}
                      hasMore={workPageData.hasMore}
                      onPageChange={setListPage}
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
        ) : activeTab === "reports" ? (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ErrorBoundary>
              <ModuleReports category="students" />
            </ErrorBoundary>
          </motion.div>
        ) : activeTab === "setup" ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ErrorBoundary>
              <StudentsSettingsPanel mode="preferences" />
            </ErrorBoundary>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {showStudentForm && (
          <StudentForm
            student={editStudent as unknown as Partial<Student> | null}
            onClose={() => { setShowStudentForm(false); setEditStudent(null); }}
            onSave={handleSaveStudent}
          />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
