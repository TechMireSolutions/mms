import React, { useMemo } from "react";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { useFacultyEntityDescriptor } from "@/tenant/features/faculty/hooks/useFacultyEntityDescriptor";
import { TeacherCardItem } from "@/tenant/features/faculty/components/FacultyCardItem";
import type { TeacherListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";

export interface FacultyListCardsProps extends Omit<
  TeacherListContentProps,
  | "sortField"
  | "sortDir"
  | "getColumnWidth"
  | "onColumnResize"
  | "onSort"
  | "viewMode"
  | "hasActiveFilters"
  | "onClearFilters"
  | "onShowActive"
> {
  faculty?: TeacherListContentProps["faculty"];
}
export type TeacherListCardsProps = FacultyListCardsProps;

export function FacultyListCards(props: FacultyListCardsProps): React.JSX.Element {
  const {
    faculty,
    teachers: teachersProp,
    selectedIds,
    allSelected,
    someSelected,
    showDeleted,
    canWrite,
    canDelete,
    isColumnVisible,
    columnRegistry,
    customFieldsById,
    statusConfig,
    onSelectAll,
    onSelectOne,
    onView,
    onEdit,
    onRequestDelete,
    onRestore,
    onSms,
    onWhatsApp,
    onEmail,
  } = props;
  const items = faculty ?? teachersProp ?? [];
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const descriptor = useFacultyEntityDescriptor();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageCountLabel = formatDirectoryPageCountLabel(items.length, t, {
    singular: "faculty.form.teacher",
    plural: "faculty.table.teachers",
  });

  return (
    <ModuleDirectoryCards
      items={items}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      allSelected={allSelected}
      someSelected={someSelected}
      selectAllLabel={t("faculty.table.selectAll") || t("teachers.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("faculty.selectedCount", { count: selectedIds.length }) || t("teachers.selectedCount", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="faculty-cards"
      renderItem={(teacher) => (
        <TeacherCardItem
          key={teacher.id}
          teacher={teacher}
          selectedSet={selectedSet}
          selectedIds={selectedIds}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          isColumnVisible={isColumnVisible}
          columnRegistry={columnRegistry}
          customFieldsById={customFieldsById}
          statusConfig={statusConfig}
          descriptor={descriptor}
          reducedMotion={reducedMotion}
          onSelectOne={onSelectOne}
          onView={onView}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          onRestore={onRestore}
          onSms={onSms}
          onWhatsApp={onWhatsApp}
          onEmail={onEmail}
        />
      )}
    />
  );
}

export const TeachersListCards = FacultyListCards;

