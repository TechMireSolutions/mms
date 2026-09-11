import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModuleTableSelectionCell } from "@/components/ui/ModuleTableSelectionCell";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
import { TableCell } from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { TeachersListRowActions } from "@/tenant/features/teachers/components/TeachersListRowActions";
import type { Teacher } from "@mms/shared";
import type { TeacherSortField } from "@/tenant/features/teachers/components/teachersListTypes";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  teacherWorkColumnCellClass,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import { teacherRowIdentity } from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { renderTeacherWorkColumnValue } from "@/tenant/features/teachers/components/teacherWorkColumnCell";

export interface TeachersListDesktopTableRowProps {
  teacher: Teacher;
  rowIndex: number;
  selectedSet: ReadonlySet<string>;
  visibleColumns: { key: TeacherSortField | string; label: string }[];
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  statusConfig: TeacherListContentProps["statusConfig"];
  customFieldsById?: TeacherListContentProps["customFieldsById"];
  emptyDash: string;
  rowMotion: (delay: number) => Record<string, unknown>;
  t: TranslationFunction;
  onSelectOne: (id: string) => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}

export const TeachersListDesktopTableRow = React.memo(function TeachersListDesktopTableRow({
  teacher,
  rowIndex,
  selectedSet,
  visibleColumns,
  showDeleted = false,
  canWrite = false,
  canDelete = false,
  statusConfig,
  customFieldsById,
  emptyDash,
  rowMotion,
  t,
  onSelectOne,
  onView,
  onEdit,
  onRequestDelete,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeachersListDesktopTableRowProps): React.JSX.Element {
  const { teacherIdStr, displayName, isSelected } = teacherRowIdentity(teacher, selectedSet, t);

  return (
    <motion.tr
      key={teacher.id}
      {...rowMotion(Math.min(rowIndex * 0.03, 0.2))}
      className={cn("hover:bg-muted/20 transition-colors group", isSelected && "bg-primary/5")}
    >
      <ModuleTableSelectionCell
        checked={isSelected}
        onCheckedChange={() => onSelectOne(teacherIdStr)}
        ariaLabel={t("teachers.table.selectTeacher", { name: displayName })}
      />
      {visibleColumns.map((col) => (
        <TableCell
          key={col.key}
          className={cn(
            "px-4 py-3",
            col.key === "name" &&
              "sticky start-12 z-10 transition-colors border-e border-border/30",
            col.key === "name" && workTableStickyCellBg(isSelected),
            col.key !== "name" && teacherWorkColumnCellClass(col.key),
          )}
        >
          {col.key === "name" ? (
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                id={teacher.id}
                name={displayName}
                avatar={teacher.avatar}
                gender={teacher.gender}
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onView(teacher)}
                  className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  title={displayName}
                >
                  <span className="block truncate">{displayName}</span>
                </Button>
                {teacher.employeeId ? (
                  <p className="text-xs text-muted-foreground truncate" title={teacher.employeeId}>
                    {teacher.employeeId}
                  </p>
                ) : null}
                {showDeleted && teacher.deletionReason ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" title={teacher.deletionReason}>
                    {t("teachers.deletionReasonLabel")}: {teacher.deletionReason}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            renderTeacherWorkColumnValue(teacher, col.key, {
              t,
              statusConfig,
              customFieldsById,
              emptyFallback: (
                <span className="text-sm text-muted-foreground">{emptyDash}</span>
              ),
            })
          )}
        </TableCell>
      ))}
      <TableCell className="px-4 py-3">
        <TeachersListRowActions
          teacher={teacher}
          teacherId={teacherIdStr}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          onView={onView}
          onRestore={onRestore}
          onSms={onSms}
          onWhatsApp={onWhatsApp}
          onEmail={onEmail}
        />
      </TableCell>
    </motion.tr>
  );
});
