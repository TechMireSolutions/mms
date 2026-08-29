import type React from "react";
import { toMessagingRecipient } from "@mms/shared";
import { DirectoryCardInfoPills } from "@/components/ui/DirectoryCardInfoPills";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { getGenderAccentBarClass } from "@/lib/directoryCardAccent";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { StudentArchivedBanner } from "@/tenant/features/students/components/StudentArchivedBanner";
import { StudentCardActions } from "@/tenant/features/students/components/StudentCardActions";
import { StudentCardHeader } from "@/tenant/features/students/components/StudentCardHeader";
import { StudentCardMetadata } from "@/tenant/features/students/components/StudentCardMetadata";
import type { StudentsListCardsProps } from "@/tenant/features/students/components/studentsListTypes";

export type { StudentsListCardsProps };

export function StudentsListCards({
  paginatedStudents,
  sessions: _sessions,
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
}: StudentsListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(paginatedStudents.length, t, {
    singular: "students.form.student",
    plural: "students.table.students",
  });

  return (
    <ModuleDirectoryCards
      items={paginatedStudents}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      allSelected={allSelected}
      someSelected={someSelected}
      selectAllLabel={t("students.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("students.selectedCount", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="students"
      renderItem={(studentCard) => {
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
            accentClassName={
              isColumnVisible("gender")
                ? getGenderAccentBarClass(isSelected, studentCard.gender)
                : undefined
            }
          >
            <StudentCardHeader
              student={studentCard}
              studentId={studentIdStr}
              isSelected={isSelected}
              displayName={displayName}
              onSelectOne={onSelectOne}
              onViewStudent={onViewStudent}
              isColumnVisible={isColumnVisible}
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
      }}
    />
  );
}

