import { useState, useMemo, useEffect, type MouseEvent, type ReactElement } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { type Student, resolveStudentStatuses } from "@mms/shared";
import { useTranslation } from '@/hooks/useTranslation';
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StudentListContent, type StudentListSortField } from "@/tenant/features/students/components/StudentListContent";
import { StudentListMessageModal } from "@/tenant/features/students/components/StudentListMessageModal";
import { StudentListProfileDrawer } from "@/tenant/features/students/components/StudentListProfileDrawer";
import { StudentListSelectionBar } from "@/tenant/features/students/components/StudentListSelectionBar";
export interface StudentListServerPagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  layout?: string;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  serverPagination?: StudentListServerPagination;
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
}

/**
 * Modern Student Table with sorting, checkboxes, pagination, row actions, and a detailed profile drawer.
 */
export default function StudentList({
  students,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
  layout = "list",
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  serverPagination,
  showDeleted = false,
  canWrite = true,
  canDelete = true,
}: StudentListProps): ReactElement {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const { statuses, isFieldEnabled } = useStudentConfig();
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const studentStatusOptions = useMemo(() => resolveStudentStatuses(statuses), [statuses]);

  const showDob = isColumnVisible
    ? isColumnVisible("dob")
    : isFieldEnabled("dob");
  const showParents = isColumnVisible
    ? isColumnVisible("parents")
    : isFieldEnabled("fatherLink") ||
      isFieldEnabled("motherLink") ||
      isFieldEnabled("guardianLink");
  const showSessions = isColumnVisible ? isColumnVisible("sessions") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;

  // Sorting State
  const [sortField, setSortField] = useState<StudentListSortField | null>("grNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Preview State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  // Messaging State
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);

  // Reset page and selection on data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [students.length, pageSize, showDeleted]);

  // Handle Header Click for Sorting
  const handleSort = (field: NonNullable<typeof sortField>) => {
    if (sortField === field) {
      setSortDir((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary transition-transform" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary transition-transform" />
    );
  };

  // Sort logic
  const sortedStudents = useMemo(() => {
    if (!sortField) return students;

    return [...students].sort((firstStudent, secondStudent) => {
      let firstSortValue = "";
      let secondSortValue = "";

      if (sortField === "name") {
        firstSortValue = (firstStudent.name || "").toLowerCase();
        secondSortValue = (secondStudent.name || "").toLowerCase();
      } else if (sortField === "age") {
        firstSortValue = firstStudent.dob || "";
        secondSortValue = secondStudent.dob || "";
        const firstDate = firstSortValue ? new Date(firstSortValue).getTime() : 0;
        const secondDate = secondSortValue ? new Date(secondSortValue).getTime() : 0;
        return sortDir === "asc" ? secondDate - firstDate : firstDate - secondDate;
      } else if (sortField === "fatherName") {
        firstSortValue = (firstStudent.fatherName || "").toLowerCase();
        secondSortValue = (secondStudent.fatherName || "").toLowerCase();
      } else if (sortField === "status") {
        firstSortValue = (firstStudent.status || "").toLowerCase();
        secondSortValue = (secondStudent.status || "").toLowerCase();
      } else if (sortField === "grNumber") {
        firstSortValue = firstStudent.grNumber || "";
        secondSortValue = secondStudent.grNumber || "";
      }

      if (firstSortValue < secondSortValue) return sortDir === "asc" ? -1 : 1;
      if (firstSortValue > secondSortValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir]);

  // Paginated data
  const paginatedStudents = useMemo(() => {
    if (serverPagination) return sortedStudents;
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize, serverPagination]);

  // Select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((student) => String(student.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((previousSelectedIds) =>
      previousSelectedIds.includes(id) ? previousSelectedIds.filter((selectedId) => selectedId !== id) : [...previousSelectedIds, id]
    );
  };

  // Row click opens drawer, ignoring checkbox/dropdown clicks
  const handleRowClick = (e: MouseEvent, student: Student) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("input[type='checkbox']") ||
      target.closest("button") ||
      target.closest("[role='menuitem']")
    ) {
      return;
    }
    setViewStudent(student);
  };

  const allSelected = paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < paginatedStudents.length;
  const selectedStudents = students.filter((s) => selectedIds.includes(String(s.id)));

  return (
    <div className="space-y-4">
      <StudentListContent
        students={students}
        paginatedStudents={paginatedStudents}
        sessions={sessions}
        layout={layout}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        showDob={showDob}
        showParents={showParents}
        showSessions={showSessions}
        showStatus={showStatus}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        currentPage={currentPage}
        pageSize={pageSize}
        hasServerPagination={Boolean(serverPagination)}
        statusBadgeConfig={statusBadgeConfig}
        isFieldEnabled={isFieldEnabled}
        renderSortIcon={renderSortIcon}
        onSort={handleSort}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onRowClick={handleRowClick}
        onViewStudent={setViewStudent}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onOpenComposer={openComposer}
        onPageChange={setCurrentPage}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />

      <StudentListSelectionBar
        selectedIds={selectedIds}
        selectedStudents={selectedStudents}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        studentStatusOptions={studentStatusOptions}
        statusBadgeConfig={statusBadgeConfig}
        onOpenComposer={openComposer}
        onBulkStatusChange={onBulkStatusChange}
        onRequestBulkDelete={() => {
          if (onBulkDelete) setConfirmBulkDeleteOpen(true);
        }}
        onRequestBulkRestore={() => {
          if (onBulkRestore) setConfirmBulkRestoreOpen(true);
        }}
        onClearSelection={() => setSelectedIds([])}
      />

      <StudentListProfileDrawer
        student={viewStudent}
        canWrite={canWrite}
        onClose={() => setViewStudent(null)}
        onEdit={(student) => {
          setViewStudent(null);
          onEdit(student);
        }}
      />

      <StudentListMessageModal
        messagingTarget={messagingTarget}
        onClose={closeComposer}
      />

      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={t("students.list.remove")}
        description={t("students.list.confirmRemoveSelected", { count: selectedIds.length })}
        confirmLabel={t("students.list.remove")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          onBulkDelete?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
      />

      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={setConfirmBulkRestoreOpen}
        title={t("students.bulkRestore")}
        description={t("students.bulkRestoreConfirm", { count: selectedIds.length })}
        confirmLabel={t("students.restore")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          onBulkRestore?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkRestoreOpen(false);
        }}
      />
    </div>
  );
}
