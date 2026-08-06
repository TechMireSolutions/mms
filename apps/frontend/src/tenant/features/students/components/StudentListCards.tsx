import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentCardActions } from "@/tenant/features/students/components/StudentCardActions";
import { StudentCardHeader } from "@/tenant/features/students/components/StudentCardHeader";
import { StudentCardMetadata } from "@/tenant/features/students/components/StudentCardMetadata";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListCards({
  paginatedStudents,
  selectedIds,
  allSelected,
  someSelected,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusBadgeConfig,
  isColumnVisible,
  isFieldEnabled,
  columnRegistry,
  onSelectAll,
  onSelectOne,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListCardsProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = `${paginatedStudents.length} ${t("nav.students").toLowerCase()}`;

  return (
    <>
      {paginatedStudents.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="students-select-all-cards"
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          selectLabel={t("students.table.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("students.selectedCount", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {paginatedStudents.map((studentCard) => {
          const studentIdStr = String(studentCard.id);
          const isSelected = selectedIds.includes(studentIdStr);
          const displayName = studentCard.name || "";

          return (
            <DirectoryEntityCard
              key={studentIdStr}
              isSelected={isSelected}
              reducedMotion={reducedMotion}
            >
              <StudentCardHeader
                student={studentCard}
                studentId={studentIdStr}
                isSelected={isSelected}
                displayName={displayName}
                onSelectOne={onSelectOne}
                onViewStudent={onViewStudent}
                reducedMotion={reducedMotion}
              />

              <StudentCardMetadata
                student={studentCard}
                statusBadgeConfig={statusBadgeConfig}
                isColumnVisible={isColumnVisible}
                isFieldEnabled={isFieldEnabled}
                columnRegistry={columnRegistry}
              />

              <StudentCardActions
                student={studentCard}
                studentId={studentIdStr}
                displayName={displayName}
                showDeleted={showDeleted}
                canWrite={canWrite}
                canDelete={canDelete}
                canWriteMessaging={canWriteMessaging}
                onViewStudent={onViewStudent}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                onOpenComposer={onOpenComposer}
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
