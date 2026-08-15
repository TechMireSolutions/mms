import React, { useMemo } from "react";
import { GraduationCap } from "lucide-react";
import type { Student } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StudentArchivedBanner } from "@/tenant/features/students/components/StudentArchivedBanner";
import { StudentDetailFieldsSection } from "@/tenant/features/students/components/StudentDetailFieldsSection";
import { StudentDetailHero } from "@/tenant/features/students/components/StudentDetailHero";
import { StudentDetailNotesSection } from "@/tenant/features/students/components/StudentDetailNotesSection";
import { StudentDetailQuickActions } from "@/tenant/features/students/components/StudentDetailQuickActions";
import { StudentDetailSessionsSection } from "@/tenant/features/students/components/StudentDetailSessionsSection";
import { useStudentDetailModel } from "@/tenant/features/students/components/useStudentDetailModel";

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  canDelete?: boolean;
  onRestore?: (studentId: string) => void | Promise<void>;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export const StudentDetail = React.memo(function StudentDetail({
  student,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
  openComposer,
  canWriteMessaging,
}: StudentDetailProps): React.JSX.Element {
  const {
    t,
    statusBadgeConfig,
    sortedEnabledFields,
    relationshipLinks,
    age,
    enrolledSessionDetails,
    sessionsLoading,
    sessionsError,
    primaryPhone,
    primaryEmail,
    hasWhatsAppContact,
    hasVisibleDetailFields,
    showNotesSection,
  } = useStudentDetailModel(student);

  const isArchived = Boolean(student.deletedAt);

  const headerActionsNode = useMemo(
    () => (
      <DetailDrawerRestoreOrEditAction
        isArchived={isArchived}
        canRestore={canDelete}
        canEdit={Boolean(onEdit)}
        restoreLabel={t("students.restore")}
        editLabel={t("students.detail.editTitle")}
        onRestore={onRestore ? () => onRestore(String(student.id)) : undefined}
        onEdit={onEdit ? () => onEdit(student) : undefined}
      />
    ),
    [isArchived, canDelete, onEdit, t, onRestore, student],
  );

  const headerExtraNode = useMemo(
    () => <StudentArchivedBanner student={student} />,
    [student],
  );

  const footerNode = useMemo(
    () => (
      <DrawerUpdatedStamp
        updatedAt={student.updatedAt}
        createdAt={student.createdAt}
        label={t("students.detail.updatedLabel")}
      />
    ),
    [student.updatedAt, student.createdAt, t],
  );

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t("students.detail.title")}
      subtitle={
        isArchived
          ? t("students.detail.archivedSubtitle")
          : t("students.detail.grSubtitle", { gr: student.grNumber || t("common.notSpecified") })
      }
      icon={GraduationCap}
      ariaLabel={t("students.detail.ariaLabel", {
        name: student.name?.trim() || t("students.form.student"),
      })}
      headerActions={headerActionsNode}
      headerExtra={headerExtraNode}
      footer={footerNode}
    >
      <StudentDetailHero student={student} statusBadgeConfig={statusBadgeConfig} />

      {!isArchived && canWriteMessaging && (
        <StudentDetailQuickActions
          student={student}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          hasWhatsAppContact={hasWhatsAppContact}
          openComposer={openComposer}
        />
      )}

      {hasVisibleDetailFields && (
        <StudentDetailFieldsSection
          student={student}
          sortedEnabledFields={sortedEnabledFields}
          age={age}
          relationshipLinks={relationshipLinks}
          openComposer={openComposer}
          messagingEnabled={!isArchived && canWriteMessaging}
        />
      )}

      {showNotesSection && student.notes ? <StudentDetailNotesSection notes={student.notes} /> : null}

      <StudentDetailSessionsSection
        sessions={enrolledSessionDetails}
        loading={sessionsLoading}
        error={sessionsError}
      />
    </DetailDrawerShell>
  );
});

export default StudentDetail;
