import { toMessagingRecipient } from "@mms/shared";
import { DirectoryCardInfoPills } from "@/components/ui/DirectoryCardInfoPills";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { getGenderAccentBarClass } from "@/lib/directoryCardAccent";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentArchivedBanner } from "@/tenant/features/students/components/StudentArchivedBanner";
import { StudentCardActions } from "@/tenant/features/students/components/StudentCardActions";
import { StudentCardHeader } from "@/tenant/features/students/components/StudentCardHeader";
import { StudentCardMetadata } from "@/tenant/features/students/components/StudentCardMetadata";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListCards({
  paginatedStudents,
  sessions,
  selectedIds,
  allSelected,
  someSelected,
  viewingDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusBadgeConfig,
  isColumnVisible,
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
  const pageCountLabel = formatDirectoryPageCountLabel(paginatedStudents.length, t, {
    singular: "students.form.student",
    plural: "students.table.students",
  });

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
          const phone = studentCard.phone?.trim() || null;
          const email = studentCard.email?.trim() || null;

          return (
            <DirectoryEntityCard
              key={studentIdStr}
              isSelected={isSelected}
              reducedMotion={reducedMotion}
              accentClassName={getGenderAccentBarClass(isSelected, studentCard.gender)}
            >
              <StudentCardHeader
                student={studentCard}
                studentId={studentIdStr}
                isSelected={isSelected}
                displayName={displayName}
                showGrNumber={isColumnVisible("grNumber")}
                showGender={isColumnVisible("gender")}
                onSelectOne={onSelectOne}
                onViewStudent={onViewStudent}
                reducedMotion={reducedMotion}
              />

              <DirectoryCardInfoPills
                phone={phone}
                phoneDisplay={phone}
                email={email}
                displayName={displayName}
                showPhone={isColumnVisible("phone")}
                showEmail={isColumnVisible("email")}
                showArchived={viewingDeleted}
                onWhatsApp={
                  canWriteMessaging && onOpenComposer && phone
                    ? () => onOpenComposer("whatsapp", [toMessagingRecipient(studentCard)])
                    : undefined
                }
                onSms={
                  canWriteMessaging && onOpenComposer && phone
                    ? () => onOpenComposer("sms", [toMessagingRecipient(studentCard)])
                    : undefined
                }
                onEmail={
                  canWriteMessaging && onOpenComposer && email
                    ? () => onOpenComposer("email", [toMessagingRecipient(studentCard)])
                    : undefined
                }
              />

              <StudentCardMetadata
                student={studentCard}
                sessions={sessions}
                statusBadgeConfig={statusBadgeConfig}
                isColumnVisible={isColumnVisible}
                columnRegistry={columnRegistry}
              />

              <StudentArchivedBanner student={studentCard} />

              <StudentCardActions
                student={studentCard}
                studentId={studentIdStr}
                displayName={displayName}
                viewingDeleted={viewingDeleted}
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
