import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModuleTableSelectionCell } from "@/components/ui/ModuleTableSelectionCell";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
import { TableCell } from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { FacultyListRowActions } from "@/tenant/features/faculty/components/FacultyListRowActions";
import type { Faculty } from "@mms/shared";
import type { FacultySortField } from "@/tenant/features/faculty/components/facultyListTypes";
import type { FacultyListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  facultyWorkColumnCellClass,
} from "@/tenant/features/faculty/components/facultyListVisibleColumns";
import { facultyRowIdentity } from "@/tenant/features/faculty/components/facultyFieldDisplay";
import { renderFacultyWorkColumnValue } from "@/tenant/features/faculty/components/facultyWorkColumnCell";

export interface FacultyListDesktopTableRowProps {
  faculty: Faculty;
  rowIndex: number;
  selectedSet: ReadonlySet<string>;
  visibleColumns: { key: FacultySortField | string; label: string }[];
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  statusConfig: FacultyListContentProps["statusConfig"];
  customFieldsById?: FacultyListContentProps["customFieldsById"];
  emptyDash: string;
  rowMotion: (delay: number) => Record<string, unknown>;
  t: TranslationFunction;
  onSelectOne: (id: string) => void;
  onView: (faculty: Faculty) => void;
  onEdit: (faculty: Faculty) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (faculty: Faculty[]) => void;
  onWhatsApp?: (faculty: Faculty[]) => void;
  onEmail?: (faculty: Faculty[]) => void;
}

export const FacultyListDesktopTableRow = React.memo(function FacultyListDesktopTableRow({
  faculty,
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
}: FacultyListDesktopTableRowProps): React.JSX.Element {
  const { facultyIdStr, displayName, isSelected } = facultyRowIdentity(faculty, selectedSet, t);

  return (
    <motion.tr
      key={faculty.id}
      {...rowMotion(Math.min(rowIndex * 0.03, 0.2))}
      className={cn("hover:bg-muted/20 transition-colors group", isSelected && "bg-primary/5")}
    >
      <ModuleTableSelectionCell
        checked={isSelected}
        onCheckedChange={() => onSelectOne(facultyIdStr)}
        ariaLabel={t("faculty.table.selectFaculty", { name: displayName })}
      />
      {visibleColumns.map((col) => (
        <TableCell
          key={col.key}
          className={cn(
            "px-4 py-3",
            col.key === "name" &&
              "sticky start-12 z-elevated transition-colors border-e border-border/30",
            col.key === "name" && workTableStickyCellBg(isSelected),
            col.key !== "name" && facultyWorkColumnCellClass(col.key),
          )}
        >
          {col.key === "name" ? (
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                id={faculty.id}
                name={displayName}
                avatar={faculty.avatar}
                gender={faculty.gender}
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onView(faculty)}
                  className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  title={displayName}
                >
                  <span className="block truncate">{displayName}</span>
                </Button>
                {faculty.employeeId ? (
                  <p className="text-xs text-muted-foreground truncate" title={faculty.employeeId}>
                    {faculty.employeeId}
                  </p>
                ) : null}
                {showDeleted && faculty.deletionReason ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" title={faculty.deletionReason}>
                    {t("faculty.deletionReasonLabel")}: {faculty.deletionReason}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            renderFacultyWorkColumnValue(faculty, col.key, {
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
        <FacultyListRowActions
          faculty={faculty}
          facultyId={facultyIdStr}
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


