import React, { useMemo } from "react";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { useFacultyEntityDescriptor } from "@/tenant/features/faculty/hooks/useFacultyEntityDescriptor";
import { TeacherCardItem } from "@/tenant/features/faculty/components/FacultyCardItem";
import type { TeacherListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";

export type TeacherListCardsProps = Omit<
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
>;

export function TeachersListCards(props: TeacherListCardsProps): React.JSX.Element {
  const {
    teachers,
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
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const descriptor = useFacultyEntityDescriptor();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageCountLabel = formatDirectoryPageCountLabel(teachers.length, t, {
    singular: "teachers.form.teacher",
    plural: "teachers.table.teachers",
  });

  return (
    <ModuleDirectoryCards
      items={teachers}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      allSelected={allSelected}
      someSelected={someSelected}
      selectAllLabel={t("teachers.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("teachers.selectedCount", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="teachers-cards"
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

export type FacultyListCardsProps = TeacherListCardsProps;
export const FacultyListCards = TeachersListCards;
