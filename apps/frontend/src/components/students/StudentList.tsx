import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, Edit2, Trash2, GraduationCap,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "../ui/StatusBadge";
import EmptyState from "../ui/EmptyState";
import { calcAge, type Student } from '@/lib/data/studentsData';
import { SESSIONS_DATA } from '@/lib/data/sessionsData';
import { formatDate, getObject } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { type StudentsSettings, DEFAULT_STUDENTS_SETTINGS } from "@mms/shared";
import StudentDetail from "./StudentDetail";

const GENDER_ICON = { male: "♂", female: "♀", other: "⚧" } as const;

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-secondary/15 text-secondary",
] as const;

function StudentAvatar({ student }: { student: Student }): JSX.Element {
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const idx = student.id.charCodeAt(student.id.length - 1) % AVATAR_COLORS.length;
  return (
    <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx]} flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: "active" | "inactive") => void;
  layout?: string;
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
  layout = "list"
}: StudentListProps): JSX.Element {
  const sessions = useLiveCollection("sessions", SESSIONS_DATA);

  const settings = useMemo(() => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS), []);
  const fields = settings.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const sortedCustomFields = useMemo(() => {
    const order = settings.fieldOrder || DEFAULT_STUDENTS_SETTINGS.fieldOrder || [];
    const orderMap = Object.fromEntries(order.map((id, index) => [id, index]));
    return [...customFields].sort((a, b) => {
      const ai = orderMap[a.id] ?? 9999;
      const bi = orderMap[b.id] ?? 9999;
      return ai - bi;
    });
  }, [customFields, settings.fieldOrder]);

  const colSpanCount = 5 + 
    (fields.dob?.enabled !== false ? 1 : 0) + 
    (fields.fatherLink?.enabled !== false || fields.motherLink?.enabled !== false || fields.guardianLink?.enabled !== false ? 1 : 0) +
    sortedCustomFields.length;

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

  // Reset page and selection on data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [students.length, pageSize]);

  // Handle Header Click for Sorting
  const handleSort = (field: NonNullable<typeof sortField>) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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

    return [...students].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === "age") {
        valA = a.dob || "";
        valB = b.dob || "";
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return sortDir === "asc" ? dateB - dateA : dateA - dateB;
      } else if (sortField === "fatherName") {
        valA = (a.fatherName || "").toLowerCase();
        valB = (b.fatherName || "").toLowerCase();
      } else if (sortField === "status") {
        valA = a.status.toLowerCase();
        valB = b.status.toLowerCase();
      } else if (sortField === "grNumber") {
        valA = a.grNumber || "";
        valB = b.grNumber || "";
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir]);

  // Paginated data
  const totalPages = Math.max(Math.ceil(sortedStudents.length / pageSize), 1);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  // Select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
            title="No students found"
            description="Try adjusting your search or filters, or register a new student."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudents.map((st) => {
              const isSelected = selectedIds.includes(st.id);
              const age = calcAge(st.dob);
              return (
                <motion.div
                  key={st.id}
                  onClick={(e) => handleRowClick(e, st)}
                  className={`relative rounded-2xl border bg-card/40 backdrop-blur-xl p-5 hover:shadow-md transition-all group cursor-pointer ${
                    isSelected ? "border-primary bg-primary/[0.015]" : "border-border/50 hover:border-primary/20"
                  }`}
                >
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(st.id)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setViewStudent(st)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(st)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit student
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(st.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col items-center text-center mt-3 mb-4">
                    <StudentAvatar student={st} />
                    <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors truncate w-full max-w-[150px]">
                      {st.name}
                    </h4>
                    {st.grNumber && (
                      <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider mt-1">
                        GR: {st.grNumber}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-border/40 pt-3 text-[11px]">
                    {fields.gender?.enabled !== false && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-semibold text-foreground capitalize">{st.gender} {GENDER_ICON[st.gender] || ""}</span>
                      </div>
                    )}
                    {fields.dob?.enabled !== false && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age / DOB:</span>
                        <span className="font-semibold text-foreground">{age ? `${age} yrs` : "—"}</span>
                      </div>
                    )}
                    {fields.fatherLink?.enabled !== false && st.fatherName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Father:</span>
                        <span className="font-semibold text-foreground truncate max-w-[100px]">{st.fatherName}</span>
                      </div>
                    )}
                    {fields.guardianLink?.enabled !== false && st.guardianName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guardian:</span>
                        <span className="font-semibold text-foreground truncate max-w-[100px]">{st.guardianName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={st.status} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer with pagination */}
        {students.length > 0 && (
          <div className="px-5 py-3 border border-border bg-muted/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing {Math.min(students.length, (currentPage - 1) * pageSize + 1)}-
              {Math.min(students.length, currentPage * pageSize)} of {students.length} students
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[8, 16, 24, 48].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {viewStudent && (
            <StudentDetail
              student={viewStudent}
              onClose={() => setViewStudent(null)}
              onEdit={(s) => {
                setViewStudent(null);
                onEdit(s);
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
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1">
                    Student {renderSortIcon("name")}
                  </div>
                </th>
                {fields.dob?.enabled !== false && (
                  <th
                    onClick={() => handleSort("age")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      Age / DOB {renderSortIcon("age")}
                    </div>
                  </th>
                )}
                {(fields.fatherLink?.enabled !== false || fields.motherLink?.enabled !== false || fields.guardianLink?.enabled !== false) && (
                  <th
                    onClick={() => handleSort("fatherName")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      Parent {renderSortIcon("fatherName")}
                    </div>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Sessions
                </th>
                {sortedCustomFields.map((field) => (
                  <th key={field.id} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    {field.label}
                  </th>
                ))}
                <th
                  onClick={() => handleSort("status")}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    Status {renderSortIcon("status")}
                  </div>
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="py-8">
                    <EmptyState
                      icon={GraduationCap}
                      title="No students found"
                      description="Try adjusting your search or filters, or register a new student."
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginatedStudents.map((st, i) => {
                    const isSelected = selectedIds.includes(st.id);
                    const age = calcAge(st.dob);
                    const sessionNames = sessions
                      .filter((s) => st.enrolledSessions?.includes(s.id))
                      .map((s) => s.name);

                    return (
                      <motion.tr
                        key={st.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.2) }}
                        onClick={(e) => handleRowClick(e, st)}
                        className={`hover:bg-muted/20 cursor-pointer transition-colors group ${
                          isSelected ? "bg-primary/[0.015]" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(st.id)}
                            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={st} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {st.name}
                                </p>
                                {st.grNumber && (
                                  <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider">
                                    GR: {st.grNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {fields.gender?.enabled !== false ? `${GENDER_ICON[st.gender] || "♂"} · ` : ""}{st.phone || "No phone"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {fields.dob?.enabled !== false && (
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-[13px] font-medium text-foreground">
                              {age ? `${age} yrs` : "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(st.dob, true)}
                            </p>
                          </td>
                        )}
                        {(fields.fatherLink?.enabled !== false || fields.motherLink?.enabled !== false || fields.guardianLink?.enabled !== false) && (
                          <td className="px-4 py-3 hidden md:table-cell">
                            {fields.fatherLink?.enabled !== false && (
                              <p className="text-[13px] text-foreground">
                                {st.fatherName || "—"}
                              </p>
                            )}
                            {fields.motherLink?.enabled !== false && (
                              <p className="text-[11px] text-muted-foreground">
                                {st.motherName || "—"}
                              </p>
                            )}
                            {fields.guardianLink?.enabled !== false && (
                              <p className="text-[11px] text-muted-foreground">
                                {st.guardianName || "—"}
                              </p>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {sessionNames.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                Not enrolled
                              </span>
                            ) : (
                              sessionNames.map((n) => (
                                <span
                                  key={n}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10"
                                >
                                  {n}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        {sortedCustomFields.map((field) => {
                          const val = (st as unknown as Record<string, unknown>)[field.id];
                          let displayVal = "—";
                          if (val !== undefined && val !== null && val !== "") {
                            if (typeof val === "boolean") {
                              displayVal = val ? "Yes" : "No";
                            } else {
                              displayVal = String(val);
                            }
                          }
                          return (
                            <td key={field.id} className="px-4 py-3 hidden md:table-cell text-[13px] text-foreground font-medium">
                              {displayVal}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={st.status} />
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setViewStudent(st)}>
                                <Eye className="w-3.5 h-3.5 mr-2" /> View profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(st)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit student
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(st.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
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
        {students.length > 0 && (
          <div className="px-5 py-3 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing {Math.min(students.length, (currentPage - 1) * pageSize + 1)}-
              {Math.min(students.length, currentPage * pageSize)} of {students.length} students
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl shadow-2xl"
          >
            <span className="text-xs font-bold text-foreground">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-border" />

            <button
              onClick={() => {
                if (onBulkStatusChange) {
                  onBulkStatusChange(selectedIds, "active");
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors"
            >
              Make Active
            </button>

            <button
              onClick={() => {
                if (onBulkStatusChange) {
                  onBulkStatusChange(selectedIds, "inactive");
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors"
            >
              Make Inactive
            </button>

            <button
              onClick={() => {
                const selectedStudents = students.filter((s) => selectedIds.includes(s.id));
                const headers = [
                  "GR Number",
                  "Name",
                  "Gender",
                  "DOB",
                  "Phone",
                  "Email",
                  "Father Name",
                  "Mother Name",
                  "Guardian Name",
                  "Status",
                  "Registered Date",
                ];
                const rows = selectedStudents.map((s) => [
                  s.grNumber || "",
                  s.name,
                  s.gender,
                  s.dob,
                  s.phone,
                  s.email,
                  s.fatherName || "",
                  s.motherName || "",
                  s.guardianName || "",
                  s.status,
                  s.registeredDate,
                ]);
                const csvContent =
                  "data:text/csv;charset=utf-8," +
                  [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `mms_students_export_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted text-foreground transition-colors"
            >
              Export CSV
            </button>

            <div className="h-4 w-px bg-border" />

            <button
              onClick={() => {
                if (onBulkDelete && window.confirm(`Are you sure you want to remove these ${selectedIds.length} students?`)) {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Profile Drawer */}
      <AnimatePresence>
        {viewStudent && (
          <StudentDetail
            student={viewStudent}
            onClose={() => setViewStudent(null)}
            onEdit={(s) => {
              setViewStudent(null);
              onEdit(s);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
