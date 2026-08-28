import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardInfoPills } from "@/components/ui/DirectoryCardInfoPills";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { getGenderAccentBarClass } from "@/lib/directoryCardAccent";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherCardActions } from "@/tenant/features/teachers/components/TeacherCardActions";
import { TeacherCardHeader } from "@/tenant/features/teachers/components/TeacherCardHeader";
import { TeacherCardMetadata } from "@/tenant/features/teachers/components/TeacherCardMetadata";
import { resolveTeacherCardFaceVisibility } from "@/tenant/features/teachers/components/teacherCardFaceVisibility";
import { teacherRowIdentity } from "@/tenant/features/teachers/components/teacherFieldDisplay";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

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
  const faceVisible = resolveTeacherCardFaceVisibility(columnRegistry, isColumnVisible);
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
      renderItem={(teacher) => {
        const { teacherIdStr, displayName, isSelected } = teacherRowIdentity(teacher, selectedIds, t);
        const { phone, email } = resolveTeacherPrimaryChannels(teacher);

        return (
          <DirectoryEntityCard
            key={teacherIdStr}
            isSelected={isSelected}
            reducedMotion={reducedMotion}
            accentClassName={
              isColumnVisible("gender")
                ? getGenderAccentBarClass(isSelected, teacher.gender)
                : undefined
            }
          >
            <TeacherCardHeader
              teacher={teacher}
              teacherId={teacherIdStr}
              isSelected={isSelected}
              displayName={displayName}
              isColumnVisible={faceVisible}
              onSelectOne={onSelectOne}
              onView={onView}
              reducedMotion={reducedMotion}
            />
            <DirectoryCardInfoPills
              phone={phone}
              phoneDisplay={phone}
              email={email}
              displayName={displayName}
              showPhone={faceVisible("phone")}
              showEmail={faceVisible("email")}
              showArchived={showDeleted}
              onWhatsApp={onWhatsApp ? () => onWhatsApp([teacher]) : undefined}
              onSms={onSms ? () => onSms([teacher]) : undefined}
              onEmail={onEmail ? () => onEmail([teacher]) : undefined}
            />
            <TeacherCardMetadata
              teacher={teacher}
              isColumnVisible={isColumnVisible}
              columnRegistry={columnRegistry}
              customFieldsById={customFieldsById}
              statusConfig={statusConfig}
            />
            <TeacherArchivedBanner teacher={teacher} />
            <TeacherCardActions
              teacher={teacher}
              teacherId={teacherIdStr}
              displayName={displayName}
              showDeleted={showDeleted}
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
      }}
    />
  );
}

