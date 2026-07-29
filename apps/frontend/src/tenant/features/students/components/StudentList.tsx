import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, Edit2, Trash2, GraduationCap,
  ChevronUp, ChevronDown, Eye,
  MessageSquare, MessageCircle, Mail, Tag, RotateCcw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { type Student, resolveStudentStatuses, calcAge, formatDate, toMessagingRecipient, toTitleCase } from "@mms/shared";
import { useTranslation } from '@/hooks/useTranslation';
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import StudentDetail from "@/tenant/features/students/components/StudentDetail";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ListPagination } from "@/components/ui/ListPagination";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));



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
}: StudentListProps): JSX.Element {
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
  const [sortField, setSortField] = useState<"name" | "age" | "fatherName" | "status" | "grNumber" | null>("grNumber");
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
  const handleRowClick = (e: React.MouseEvent, student: Student) => {
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
      {layout === "cards" ? (
        paginatedStudents.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={t("students.list.emptyTitle")}
            description={t("students.list.emptyDesc")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudents.map((studentCard) => {
              const studentIdStr = String(studentCard.id);
              const isSelected = selectedIds.includes(studentIdStr);
              const age = calcAge(studentCard.dob);
              return (
                <motion.div
                  key={studentIdStr}
                  onClick={(event) => handleRowClick(event, studentCard)}
                  className={`relative rounded-2xl border bg-card/40 backdrop-blur-xl p-5 hover:shadow-md transition-all group cursor-pointer ${
                    isSelected ? "border-primary bg-primary/[0.015]" : "border-border/50 hover:border-primary/20"
                  }`}
                >
                  <div className="absolute top-3 start-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectOne(studentIdStr)}
                    />
                  </div>
                  <div className="absolute top-3 end-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t("students.list.actionsAria")} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {!showDeleted && (
                          <>
                            <DropdownMenuItem onClick={() => setViewStudent(studentCard)}>
                              <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
                            </DropdownMenuItem>
                            {canWrite && (
                              <DropdownMenuItem onClick={() => onEdit(studentCard)}>
                                <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(studentIdStr)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        )}
                        {showDeleted && canDelete && onRestore && (
                          <DropdownMenuItem onClick={() => onRestore(studentIdStr)}>
                            <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("students.restore")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col items-center text-center mt-3 mb-4">
                    <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="w-12 h-12 rounded-full text-sm font-bold shadow-sm" />
                    <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors truncate w-full max-w-[9.375rem]">
                      {studentCard.name}
                    </h4>
                    <GrBadge grNumber={studentCard.grNumber} className="mt-1" />
                  </div>

                  <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
                    {isFieldEnabled("gender") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.gender")}:</span>
                        <span className="font-semibold text-foreground">{studentCard.gender ? toTitleCase(studentCard.gender) : "—"}</span>
                      </div>
                    )}
                    {isFieldEnabled("dob") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.columns.dob")}:</span>
                        <span className="font-semibold text-foreground">{age ? t("students.list.ageYears", { age }) : "—"}</span>
                      </div>
                    )}
                    {isFieldEnabled("fatherLink") && studentCard.fatherName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.detail.father")}:</span>
                        <span className="font-semibold text-foreground truncate max-w-[6.25rem]">{studentCard.fatherName}</span>
                      </div>
                    )}
                    {isFieldEnabled("guardianLink") && studentCard.guardianName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.detail.guardian")}:</span>
                        <span className="font-semibold text-foreground truncate max-w-[6.25rem]">{studentCard.guardianName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("students.columns.status")}:</span>
                      <StatusBadge status={studentCard.status || "active"} config={statusBadgeConfig} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
      <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
        {paginatedStudents.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={t("students.list.emptyTitle")}
            description={t("students.list.emptyDesc")}
          />
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {paginatedStudents.map((studentCard, rowIndex) => {
                const studentIdStr = String(studentCard.id);
                const isSelected = selectedIds.includes(studentIdStr);
                const age = calcAge(studentCard.dob);
                const sessionNames = sessions
                  .filter((session) => studentCard.enrolledSessions?.includes(session.id))
                  .map((session) => session.name);

                return (
                  <motion.article
                    key={studentIdStr}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
                    onClick={(event) => handleRowClick(event, studentCard)}
                    className={`space-y-3 rounded-xl border border-border bg-card p-3 cursor-pointer ${
                      isSelected ? "ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectOne(studentIdStr)}
                          aria-label={t("students.columns.name")}
                        />
                        <div className="flex min-w-0 items-center gap-2.5">
                          <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="h-8 w-8 shrink-0 rounded-full text-xs font-bold" />
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p className="min-w-0 truncate text-sm font-semibold text-foreground">{studentCard.name}</p>
                              <span className="shrink-0"><GrBadge grNumber={studentCard.grNumber} /></span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {isFieldEnabled("gender") && studentCard.gender ? `${toTitleCase(studentCard.gender)} · ` : ""}{studentCard.phone || t("students.list.noPhone")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {showStatus && <StatusBadge status={studentCard.status || "active"} config={statusBadgeConfig} size="sm" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t("students.list.actionsAria")} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {!showDeleted && (
                              <>
                                <DropdownMenuItem onClick={() => setViewStudent(studentCard)}>
                                  <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
                                </DropdownMenuItem>
                                {canWrite && (
                                  <DropdownMenuItem onClick={() => onEdit(studentCard)}>
                                    <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openComposer("whatsapp", [toMessagingRecipient(studentCard)])}>
                                  <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {t("students.list.actionWhatsApp")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openComposer("sms", [toMessagingRecipient(studentCard)])}>
                                  <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {t("students.list.actionSms")}
                                </DropdownMenuItem>
                                {studentCard.email && (
                                  <DropdownMenuItem onClick={() => openComposer("email", [toMessagingRecipient(studentCard)])}>
                                    <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {t("students.list.actionEmail")}
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => onDelete(studentIdStr)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                            {showDeleted && canDelete && onRestore && (
                              <DropdownMenuItem onClick={() => onRestore(studentIdStr)}>
                                <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("students.restore")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      {showDob && (
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("students.columns.dob")}</dt>
                          <dd className="text-foreground">
                            {age ? t("students.list.ageYears", { age }) : "—"}
                            {studentCard.dob && (
                              <span className="block text-xs text-muted-foreground">{formatDate(studentCard.dob, true)}</span>
                            )}
                          </dd>
                        </div>
                      )}
                      {showParents && isFieldEnabled("fatherLink") && studentCard.fatherName && (
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.father")}</dt>
                          <dd className="text-foreground truncate">{studentCard.fatherName}</dd>
                        </div>
                      )}
                      {showParents && isFieldEnabled("motherLink") && studentCard.motherName && (
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.mother")}</dt>
                          <dd className="text-foreground truncate">{studentCard.motherName}</dd>
                        </div>
                      )}
                      {showParents && isFieldEnabled("guardianLink") && studentCard.guardianName && (
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.guardian")}</dt>
                          <dd className="text-foreground truncate">{studentCard.guardianName}</dd>
                        </div>
                      )}
                      {showSessions && (
                        <div className={showDob && showParents ? "sm:col-span-2" : ""}>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("students.columns.sessions")}</dt>
                          <dd className="flex flex-wrap gap-1">
                            {sessionNames.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">{t("students.list.notEnrolled")}</span>
                            ) : (
                              sessionNames.map((sessionName) => (
                                <span
                                  key={sessionName}
                                  className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10"
                                >
                                  {sessionName}
                                </span>
                              ))
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </motion.article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={someSelected ? "indeterminate" : allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <ResizableTableHead
                  columnKey="name"
                  width={getColumnWidth?.("name")}
                  onResize={onColumnResize}
                  onClick={() => handleSort("name")}
                  className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1">
                    {t("students.columns.name")} {renderSortIcon("name")}
                  </div>
                </ResizableTableHead>
                {showDob && (
                  <ResizableTableHead
                    columnKey="dob"
                    width={getColumnWidth?.("dob")}
                    onResize={onColumnResize}
                    onClick={() => handleSort("age")}
                    className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      {t("students.columns.dob")} {renderSortIcon("age")}
                    </div>
                  </ResizableTableHead>
                )}
                {showParents && (
                  <ResizableTableHead
                    columnKey="parents"
                    width={getColumnWidth?.("parents")}
                    onResize={onColumnResize}
                    onClick={() => handleSort("fatherName")}
                    className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      {t("students.columns.parents")} {renderSortIcon("fatherName")}
                    </div>
                  </ResizableTableHead>
                )}
                {showSessions && (
                <ResizableTableHead columnKey="sessions" width={getColumnWidth?.("sessions")} onResize={onColumnResize} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  {t("students.columns.sessions")}
                </ResizableTableHead>
                )}

                {showStatus && (
                <ResizableTableHead
                  columnKey="status"
                  width={getColumnWidth?.("status")}
                  onResize={onColumnResize}
                  onClick={() => handleSort("status")}
                  className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    {t("students.columns.status")} {renderSortIcon("status")}
                  </div>
                </ResizableTableHead>
                )}
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
                <AnimatePresence>
                  {paginatedStudents.map((studentRow, rowIndex) => {
                    const studentIdStr = String(studentRow.id);
                    const isSelected = selectedIds.includes(studentIdStr);
                    const age = calcAge(studentRow.dob);
                    const sessionNames = sessions
                      .filter((session) => studentRow.enrolledSessions?.includes(session.id))
                      .map((session) => session.name);

                    return (
                      <motion.tr
                        key={studentIdStr}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
                        onClick={(event) => handleRowClick(event, studentRow)}
                        className={`hover:bg-muted/20 cursor-pointer transition-colors group ${
                          isSelected ? "bg-primary/[0.015]" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectOne(studentIdStr)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar id={studentIdStr} name={studentRow.name || ""} className="w-8 h-8 rounded-full text-xs font-bold" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {studentRow.name}
                                </p>
                                <GrBadge grNumber={studentRow.grNumber} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {isFieldEnabled("gender") && studentRow.gender ? `${toTitleCase(studentRow.gender)} · ` : ""}{studentRow.phone || t("students.list.noPhone")}
                              </p>
                            </div>
                          </div>
                        </td>
                        {showDob && (
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-sm font-medium text-foreground">
                              {age ? t("students.list.ageYears", { age }) : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(studentRow.dob, true)}
                            </p>
                          </td>
                        )}
                        {showParents && (
                          <td className="px-4 py-3 hidden md:table-cell">
                            {isFieldEnabled("fatherLink") && (
                              <p className="text-sm text-foreground">
                                {studentRow.fatherName || "—"}
                              </p>
                            )}
                            {isFieldEnabled("motherLink") && (
                              <p className="text-xs text-muted-foreground">
                                {studentRow.motherName || "—"}
                              </p>
                            )}
                            {isFieldEnabled("guardianLink") && (
                              <p className="text-xs text-muted-foreground">
                                {studentRow.guardianName || "—"}
                              </p>
                            )}
                          </td>
                        )}
                        {showSessions && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {sessionNames.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">
                                {t("students.list.notEnrolled")}
                              </span>
                            ) : (
                              sessionNames.map((sessionName) => (
                                <span
                                  key={sessionName}
                                  className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10"
                                >
                                  {sessionName}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        )}

                        {showStatus && (
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={studentRow.status || "active"} config={statusBadgeConfig} />
                        </td>
                        )}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("students.list.actionsAria")} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {!showDeleted && (
                                <>
                                  <DropdownMenuItem onClick={() => setViewStudent(studentRow)}>
                                    <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
                                  </DropdownMenuItem>
                                  {canWrite && (
                                    <DropdownMenuItem onClick={() => onEdit(studentRow)}>
                                      <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openComposer("whatsapp", [toMessagingRecipient(studentRow)])}>
                                    <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {t("students.list.actionWhatsApp")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openComposer("sms", [toMessagingRecipient(studentRow)])}>
                                    <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {t("students.list.actionSms")}
                                  </DropdownMenuItem>
                                  {studentRow.email && (
                                    <DropdownMenuItem onClick={() => openComposer("email", [toMessagingRecipient(studentRow)])}>
                                      <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {t("students.list.actionEmail")}
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => onDelete(studentIdStr)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              {showDeleted && canDelete && onRestore && (
                                <DropdownMenuItem onClick={() => onRestore(studentIdStr)}>
                                  <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("students.restore")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
            </tbody>
          </table>
            </div>
          </>
        )}

        {/* Footer with pagination */}
        {students.length > 0 && !serverPagination && (
          <ListPagination
            page={currentPage}
            total={students.length}
            limit={pageSize}
            onPageChange={setCurrentPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
      </div>
      )}

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 z-40 max-w-full sm:inset-x-auto sm:end-6 sm:bottom-6 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex flex-wrap items-center gap-3 border-s-4 border-s-primary"
          >
            <span className="text-xs font-bold text-foreground ps-1">
              {t("students.selectedCount", { count: selectedIds.length })}
            </span>

            <div className="h-4 w-px bg-border" />

            {showDeleted ? (
              canDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (onBulkRestore) setConfirmBulkRestoreOpen(true); }}
                className="px-3 py-1.5 rounded-lg border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors min-h-11 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t("students.bulkRestore")}
              </Button>
              )
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openComposer("whatsapp", selectedStudents.map((s) => toMessagingRecipient(s)))}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-success" /> {t("students.list.actionWhatsApp")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openComposer("sms", selectedStudents.map((s) => toMessagingRecipient(s)))}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-info" /> {t("students.list.actionSms")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openComposer("email", selectedStudents.filter((s) => s.email).map((s) => toMessagingRecipient(s)))}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" /> {t("students.list.actionEmail")}
                </Button>

                {canWrite && onBulkStatusChange && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5 text-primary" /> {t("students.columns.status")} <ChevronDown className="w-3 h-3 ms-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {studentStatusOptions.map((statusVal) => (
                        <DropdownMenuItem
                          key={statusVal}
                          onClick={() => {
                            onBulkStatusChange(selectedIds, statusVal);
                            setSelectedIds([]);
                          }}
                        >
                          <StatusBadge status={statusVal} size="sm" config={statusBadgeConfig} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {canDelete && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => { if (onBulkDelete) setConfirmBulkDeleteOpen(true); }}
                      className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11"
                    >
                      {t("students.list.remove")}
                    </Button>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Profile Drawer */}
      <AnimatePresence>
        {viewStudent && (
          <StudentDetail
            student={viewStudent}
            onClose={() => setViewStudent(null)}
            onEdit={canWrite ? (student) => {
              setViewStudent(null);
              onEdit(student);
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Message Composer Modal */}
      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}

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
