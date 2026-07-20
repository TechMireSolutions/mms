import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, GraduationCap, Filter, ChevronDown, Users,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
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
import { Student } from '@/lib/data/studentsData';
import { type Student as SharedStudent, type StudentsSettings, STUDENTS_MODULE_CONTRACT, todayISO, toTitleCase } from "@mms/shared";


import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { useStudentCount } from "@/tenant/features/students/hooks/useStudentCount";
import { useStudentsPaginated, useStudentMutations, fetchAllStudentsForQuery, type StudentRecord } from "@/tenant/features/students/hooks/useStudents";
import { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";

const STUDENTS_GR_MIGRATION_KEY = "mms_students_gr_migration_v1";

function grMigrationAlreadyDone(): boolean {
  try {
    return localStorage.getItem(STUDENTS_GR_MIGRATION_KEY) === "1";
  } catch {
    return false;
  }
}

function applyGrNumberMigration(
  rawStudents: StudentRecord[],
  settings: StudentsSettings,
): { students: Student[]; didMigrate: boolean } {
  const template = settings.grNumberTemplate || "{seq}-{year}";
  const digits = settings.grNumberDigits || 4;
  const restartAnnually = settings.grNumberRestartAnnually !== false;

  let didMigrate = false;
  const migratedStudents = rawStudents.map((studentRecord, studentIndex) => {
    if (!studentRecord.grNumber) {
      didMigrate = true;
      const registeredDate = (studentRecord.registeredDate as string | undefined) || todayISO();

      const year = registeredDate ? new Date(registeredDate).getFullYear() : new Date().getFullYear();

      let nextSeq = 1;
      if (restartAnnually) {
        const yearlyStudents = rawStudents.slice(0, studentIndex).filter((previousStudent) => {
          const previousRegisteredDate = (previousStudent.registeredDate as string | undefined) || "";
          if (previousRegisteredDate.startsWith(String(year))) return true;
          if (previousStudent.grNumber && String(previousStudent.grNumber).includes(String(year))) return true;
          return false;
        });
        nextSeq = yearlyStudents.length + 1;
      } else {
        nextSeq = studentIndex + 1;
      }

      const seqStr = String(nextSeq).padStart(digits, "0");
      const autoGr = template.replace("{seq}", seqStr).replace("{year}", String(year));
      return { ...studentRecord, grNumber: autoGr } as unknown as Student;
    }
    return studentRecord as unknown as Student;
  });

  return { students: migratedStudents, didMigrate };
}

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
  const { createStudent, updateStudent, deleteStudent } = useStudentMutations();
  const { settings, statuses: studentStatusOptions, genderFilters } = useStudentConfig();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("students_active_tab", "work");
  const [needsMigrationScan, setNeedsMigrationScan] = useState(() => !grMigrationAlreadyDone());
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [listPage, setListPage] = useState(1);

  const {
    columnRegistry,
    isColumnVisible,
    updateUserColumnLayout,
    customizerLabels,
  } = useStudentColumnLayout(settings);

  const migrationAppliedRef = useRef(false);
  useEffect(() => {
    if (!needsMigrationScan || activeTab !== "work") return;
    let cancelled = false;
    void (async () => {
      try {
        const rawForMigration = await fetchAllStudentsForQuery({});
        if (cancelled) return;
        const { students: migratedForGr, didMigrate } = applyGrNumberMigration(rawForMigration, settings);
        if (didMigrate && !migrationAppliedRef.current) {
          migrationAppliedRef.current = true;
          await Promise.all(
            migratedForGr.map((student) =>
              updateStudent.mutateAsync({ id: String(student.id), student: student as unknown as StudentRecord }),
            ),
          );
        }
      } finally {
        if (!cancelled) {
          try {
            localStorage.setItem(STUDENTS_GR_MIGRATION_KEY, "1");
          } catch {
            /* ignore */
          }
          setNeedsMigrationScan(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsMigrationScan, activeTab, settings, updateStudent]);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);

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
    () => (workPageData?.students ?? []) as unknown as Student[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? 0;
  const workTruncated = useServerWork && !isListView && Boolean(workPageData?.hasMore);

  const filteredStudents = workStudents;

  const handleSaveStudent = async (studentToSave: SharedStudent) => {
    if (editStudent) {
      await updateStudent.mutateAsync({
        id: String(studentToSave.id),
        student: studentToSave as unknown as StudentRecord,
      });
    } else {
      await createStudent.mutateAsync(studentToSave as unknown as StudentRecord);
    }
  };

  const toggleStudentStatus = (status: string) =>
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  const studentFilterChips = [
    ...studentFilterStatus.map((status) => ({ key: status, label: status, onRemove: () => toggleStudentStatus(status) })),
    ...(studentFilterGender ? [{ key: "gender", label: studentFilterGender, onRemove: () => setStudentFilterGender("") }] : []),
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
                placeholder="Search students directory…"
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
                    <Filter className="w-3.5 h-3.5" /> Status
                    {studentFilterStatus.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {studentFilterStatus.length}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {studentStatusOptions.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={studentFilterStatus.includes(status)}
                      onCheckedChange={() => toggleStudentStatus(status)}
                    >
                      {toTitleCase(status)}
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
                    students={filteredStudents}
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
                    onBulkDelete={(studentIds) => studentIds.forEach((studentId) => deleteStudent.mutate(String(studentId)))}
                    onBulkStatusChange={(studentIds, status) => {
                      for (const studentId of studentIds) {
                        const student = workStudents.find((workStudent) => workStudent.id === studentId);
                        if (student) {
                          updateStudent.mutate({ id: String(studentId), student: { ...student, status } as unknown as StudentRecord });
                        }
                      }
                    }}
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
              <div className="space-y-4">
                <KPISummary category="students" />
                <ModuleReports category="students" />
              </div>
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
            student={editStudent as unknown as Partial<SharedStudent> | null}
            onClose={() => { setShowStudentForm(false); setEditStudent(null); }}
            onSave={handleSaveStudent}
          />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
