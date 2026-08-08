import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherCardActions } from "@/tenant/features/teachers/components/TeacherCardActions";
import { TeacherCardHeader } from "@/tenant/features/teachers/components/TeacherCardHeader";
import { TeacherCardMetadata } from "@/tenant/features/teachers/components/TeacherCardMetadata";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

type TeacherListCardsProps = Omit<
  TeacherListContentProps,
  "sortField" | "sortDir" | "getColumnWidth" | "onColumnResize" | "onSort" | "viewMode"
>;

export function TeacherListCards(props: TeacherListCardsProps): React.JSX.Element {
  const {
    teachers,
    selectedIds,
    allSelected,
    someSelected,
    showSelectColumn,
    showActionsColumn,
    showDeleted,
    canWrite,
    canDelete,
    isColumnVisible,
    visibleCustomFields,
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
  const pageCountLabel = `${teachers.length} ${t("nav.teachers").toLowerCase()}`;

  return (
    <>
      {showSelectColumn && teachers.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="teachers-select-all-cards"
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          selectLabel={t("teachers.table.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("teachers.selectedCount", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {teachers.map((teacher) => {
          const teacherIdStr = String(teacher.id);
          const displayName = teacher.name || t("teachers.contactMissing");
          const isSelected = selectedIds.includes(teacherIdStr);

          return (
            <DirectoryEntityCard
              key={teacherIdStr}
              isSelected={isSelected}
              reducedMotion={reducedMotion}
            >
              <TeacherCardHeader
                teacher={teacher}
                teacherId={teacherIdStr}
                isSelected={isSelected}
                displayName={displayName}
                showSelectColumn={showSelectColumn}
                onSelectOne={onSelectOne}
                onView={onView}
                reducedMotion={reducedMotion}
              />
              <TeacherArchivedBanner teacher={teacher} />
              <TeacherCardMetadata
                teacher={teacher}
                isColumnVisible={isColumnVisible}
                visibleCustomFields={visibleCustomFields}
                statusConfig={statusConfig}
              />
              <TeacherCardActions
                teacher={teacher}
                teacherId={teacherIdStr}
                displayName={displayName}
                showDeleted={showDeleted}
                showActionsColumn={showActionsColumn}
                canWrite={canWrite}
                canDelete={canDelete}
                onView={onView}
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
                onRestore={onRestore}
                onSms={onSms}
                onWhatsApp={onWhatsApp}
                onEmail={onEmail}
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
