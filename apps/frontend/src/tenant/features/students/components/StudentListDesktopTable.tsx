import { AnimatePresence, motion } from "framer-motion";
import { calcAge, formatDate, toTitleCase } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentListDesktopTableProps = Pick<
  StudentListTableProps,
  | "paginatedStudents"
  | "sessions"
  | "selectedIds"
  | "allSelected"
  | "someSelected"
  | "showDob"
  | "showParents"
  | "showSessions"
  | "showStatus"
  | "showDeleted"
  | "canWrite"
  | "canDelete"
  | "statusBadgeConfig"
  | "isFieldEnabled"
  | "renderSortIcon"
  | "onSort"
  | "onSelectAll"
  | "onSelectOne"
  | "onRowClick"
  | "onViewStudent"
  | "onEdit"
  | "onDelete"
  | "onRestore"
  | "onOpenComposer"
  | "getColumnWidth"
  | "onColumnResize"
>;

export function StudentListDesktopTable({
  paginatedStudents,
  sessions,
  selectedIds,
  allSelected,
  someSelected,
  showDob,
  showParents,
  showSessions,
  showStatus,
  showDeleted,
  canWrite,
  canDelete,
  statusBadgeConfig,
  isFieldEnabled,
  renderSortIcon,
  onSort,
  onSelectAll,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
  getColumnWidth,
  onColumnResize,
}: StudentListDesktopTableProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            <th className="w-10 px-4 py-3">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <ResizableTableHead
              columnKey="name"
              width={getColumnWidth?.("name")}
              onResize={onColumnResize}
              onClick={() => onSort("name")}
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
                onClick={() => onSort("age")}
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
                onClick={() => onSort("fatherName")}
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
                onClick={() => onSort("status")}
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
                  onClick={(event) => onRowClick(event, studentRow)}
                  className={`hover:bg-muted/20 cursor-pointer transition-colors group ${
                    isSelected ? "bg-primary/[0.015]" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectOne(studentIdStr)}
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
                    <StudentListActionsMenu
                      student={studentRow}
                      studentId={studentIdStr}
                      showDeleted={showDeleted}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      includeMessaging
                      triggerClassName="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
                      contentClassName="w-44"
                      iconClassName="w-4 h-4"
                      onViewStudent={onViewStudent}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRestore={onRestore}
                      onOpenComposer={onOpenComposer}
                    />
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
