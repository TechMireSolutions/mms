import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, Edit2, Trash2, GraduationCap,
  ChevronUp, ChevronDown, Eye,
  MessageSquare, MessageCircle, Mail
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { type FieldDefinition, type Student, calcAge, formatDate } from "@mms/shared";
import { useTranslation } from '@/hooks/useTranslation';
import StudentDetail from "@/tenant/features/students/components/StudentDetail";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ListPagination } from "@/components/ui/ListPagination";

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
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  layout?: string;
  isColumnVisible?: (key: string) => boolean;
  serverPagination?: StudentListServerPagination;
}

/**
 * Modern Student Table with sorting, checkboxes, pagination, row actions, and a detailed profile drawer.
 */
export default function StudentList({
  students,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  layout = "list",
  isColumnVisible,
  serverPagination,
}: StudentListProps): JSX.Element {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const { settings, statuses, isFieldEnabled } = useStudentConfig();

  const sortedCustomFields = useMemo(() => {
    const customFieldColumns: Array<{ id: string; label: string }> = [];
    Object.entries(settings.fields || {}).forEach(([tabId, tabFields]) => {
      (tabFields as FieldDefinition[]).forEach((fieldDefinition) => {
        const isSystemField =
          (tabId === "basic" && ["gender", "dob", "registeredDate"].includes(fieldDefinition.key)) ||
          (tabId === "guardians" && ["fatherLink", "motherLink", "guardianLink"].includes(fieldDefinition.key));
        if (!isSystemField) {
          customFieldColumns.push({ id: fieldDefinition.key, label: fieldDefinition.label });
        }
      });
    });
    return customFieldColumns;
  }, [settings.fields]);

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
  const visibleCustomFields = sortedCustomFields.filter((field) =>
    isColumnVisible ? isColumnVisible(`custom:${field.id}`) : true,
  );

  const colSpanCount = 2 +
    1 +
    (showDob ? 1 : 0) +
    (showParents ? 1 : 0) +
    (showSessions ? 1 : 0) +
    visibleCustomFields.length +
    (showStatus ? 1 : 0);

  // Sorting State
  const [sortField, setSortField] = useState<"name" | "age" | "fatherName" | "status" | "grNumber" | null>("grNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Preview State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  // Messaging State
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  // Reset page and selection on data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [students.length, pageSize]);

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
  const totalPages = Math.max(Math.ceil(sortedStudents.length / pageSize), 1);
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

  if (layout === "cards") {
    return (
      <div className="space-y-4">
        {paginatedStudents.length === 0 ? (
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
                  <div className="absolute top-3 left-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectOne(studentIdStr)}
                    />
                  </div>
                  <div className="absolute top-3 end-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Student actions" className="h-7 w-7 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setViewStudent(studentCard)}>
                          <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(studentCard)}>
                          <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(studentIdStr)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col items-center text-center mt-3 mb-4">
                    <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="w-8 h-8 rounded-full text-[11px] font-bold" />
                    <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors truncate w-full max-w-[150px]">
                      {studentCard.name}
                    </h4>
                    {studentCard.grNumber && (
                      <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider mt-1">
                        GR: {studentCard.grNumber}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-border/40 pt-3 text-[11px]">
                    {isFieldEnabled("gender") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.gender")}:</span>
                        <span className="font-semibold text-foreground capitalize">{studentCard.gender || "—"}</span>
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
                        <span className="font-semibold text-foreground truncate max-w-[100px]">{studentCard.fatherName}</span>
                      </div>
                    )}
                    {isFieldEnabled("guardianLink") && studentCard.guardianName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("students.detail.guardian")}:</span>
                        <span className="font-semibold text-foreground truncate max-w-[100px]">{studentCard.guardianName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("students.columns.status")}:</span>
                      <StatusBadge status={studentCard.status || "active"} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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

        <AnimatePresence>
          {viewStudent && (
            <StudentDetail
              student={viewStudent}
              onClose={() => setViewStudent(null)}
              onEdit={(student) => {
                setViewStudent(null);
                onEdit(student);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={someSelected ? "indeterminate" : allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1">
                    {t("students.columns.name")} {renderSortIcon("name")}
                  </div>
                </th>
                {showDob && (
                  <th
                    onClick={() => handleSort("age")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      {t("students.columns.dob")} {renderSortIcon("age")}
                    </div>
                  </th>
                )}
                {showParents && (
                  <th
                    onClick={() => handleSort("fatherName")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      {t("students.columns.parents")} {renderSortIcon("fatherName")}
                    </div>
                  </th>
                )}
                {showSessions && (
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  {t("students.columns.sessions")}
                </th>
                )}
                {visibleCustomFields.map((field) => (
                  <th key={field.id} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    {field.label}
                  </th>
                ))}
                {showStatus && (
                <th
                  onClick={() => handleSort("status")}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    {t("students.columns.status")} {renderSortIcon("status")}
                  </div>
                </th>
                )}
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="py-8">
                    <EmptyState
                      icon={GraduationCap}
                      title={t("students.list.emptyTitle")}
                      description={t("students.list.emptyDesc")}
                    />
                  </td>
                </tr>
              ) : (
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
                            <UserAvatar id={studentIdStr} name={studentRow.name || ""} className="w-8 h-8 rounded-full text-[11px] font-bold" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {studentRow.name}
                                </p>
                                {studentRow.grNumber && (
                                  <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider">
                                    GR: {studentRow.grNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {isFieldEnabled("gender") && studentRow.gender ? `${studentRow.gender} · ` : ""}{studentRow.phone || t("students.list.noPhone")}
                              </p>
                            </div>
                          </div>
                        </td>
                        {showDob && (
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-[13px] font-medium text-foreground">
                              {age ? t("students.list.ageYears", { age }) : "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(studentRow.dob, true)}
                            </p>
                          </td>
                        )}
                        {showParents && (
                          <td className="px-4 py-3 hidden md:table-cell">
                            {isFieldEnabled("fatherLink") && (
                              <p className="text-[13px] text-foreground">
                                {studentRow.fatherName || "—"}
                              </p>
                            )}
                            {isFieldEnabled("motherLink") && (
                              <p className="text-[11px] text-muted-foreground">
                                {studentRow.motherName || "—"}
                              </p>
                            )}
                            {isFieldEnabled("guardianLink") && (
                              <p className="text-[11px] text-muted-foreground">
                                {studentRow.guardianName || "—"}
                              </p>
                            )}
                          </td>
                        )}
                        {showSessions && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {sessionNames.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                {t("students.list.notEnrolled")}
                              </span>
                            ) : (
                              sessionNames.map((sessionName) => (
                                <span
                                  key={sessionName}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10"
                                >
                                  {sessionName}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        )}
                        {visibleCustomFields.map((field) => {
                          const fieldValue = (studentRow as unknown as Record<string, unknown>)[field.id];
                          let displayValue = "—";
                          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
                            if (typeof fieldValue === "boolean") {
                              displayValue = fieldValue ? t("students.list.yes") : t("students.list.no");
                            } else {
                              displayValue = String(fieldValue);
                            }
                          }
                          return (
                            <td key={field.id} className="px-4 py-3 hidden md:table-cell text-[13px] text-foreground font-medium">
                              {displayValue}
                            </td>
                          );
                        })}
                        {showStatus && (
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={studentRow.status || "active"} />
                        </td>
                        )}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Student actions" className="h-8 w-8 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setViewStudent(studentRow)}>
                                <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(studentRow)}>
                                <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openComposer("whatsapp", [{ id: studentIdStr, name: studentRow.name || "", phone: studentRow.phone || "", email: studentRow.email || "" }])}>
                                <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openComposer("sms", [{ id: studentIdStr, name: studentRow.name || "", phone: studentRow.phone || "", email: studentRow.email || "" }])}>
                                <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> Send SMS
                              </DropdownMenuItem>
                              {studentRow.email && (
                                <DropdownMenuItem onClick={() => openComposer("email", [{ id: studentIdStr, name: studentRow.name || "", phone: studentRow.phone || "", email: studentRow.email }])}>
                                  <Mail className="w-3.5 h-3.5 me-2 text-primary" /> Send Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(studentIdStr)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

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

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 end-6 z-40 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border-s-4 border-s-primary"
          >
            <span className="text-xs font-bold text-foreground ps-1">
              {t("students.selectedCount", { count: selectedIds.length })}
            </span>

            <div className="h-4 w-px bg-border" />

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const selectedRecipients = students
                  .filter((s) => selectedIds.includes(String(s.id)))
                  .map((s) => ({ id: String(s.id), name: s.name || "", phone: s.phone || "", email: s.email || "" }));
                openComposer("whatsapp", selectedRecipients);
              }}
              className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-success" /> WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const selectedRecipients = students
                  .filter((s) => selectedIds.includes(String(s.id)))
                  .map((s) => ({ id: String(s.id), name: s.name || "", phone: s.phone || "", email: s.email || "" }));
                openComposer("sms", selectedRecipients);
              }}
              className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-info" /> SMS
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const selectedRecipients = students
                  .filter((s) => selectedIds.includes(String(s.id)))
                  .filter((s) => s.email)
                  .map((s) => ({ id: String(s.id), name: s.name || "", phone: s.phone || "", email: s.email! }));
                openComposer("email", selectedRecipients);
              }}
              className="px-3 py-1.5 rounded-lg border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors h-auto flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-primary" /> Email
            </Button>

            <div className="h-4 w-px bg-border" />

            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (onBulkDelete && window.confirm(t("students.list.confirmRemoveSelected", { count: selectedIds.length }))) {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90 transition-colors h-auto"
            >
              {t("students.list.remove")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Profile Drawer */}
      <AnimatePresence>
        {viewStudent && (
          <StudentDetail
            student={viewStudent}
            onClose={() => setViewStudent(null)}
            onEdit={(student) => {
              setViewStudent(null);
              onEdit(student);
            }}
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
    </div>
  );
}

