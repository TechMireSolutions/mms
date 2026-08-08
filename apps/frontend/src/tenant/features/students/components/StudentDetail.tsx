import React from "react";
import { GraduationCap } from "lucide-react";
import type { Student } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DetailDrawerRestoreOrEditAction,
  DrawerSyncStatusFooter,
} from "@/components/ui/DetailDrawerArchiveChrome";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StudentArchivedBanner } from "@/tenant/features/students/components/StudentArchivedBanner";
import { StudentDetailFieldsSection } from "@/tenant/features/students/components/StudentDetailFieldsSection";
import { StudentDetailHero } from "@/tenant/features/students/components/StudentDetailHero";
import { StudentDetailNotesSection } from "@/tenant/features/students/components/StudentDetailNotesSection";
import { StudentDetailQuickActions } from "@/tenant/features/students/components/StudentDetailQuickActions";
import { StudentDetailSessionsSection } from "@/tenant/features/students/components/StudentDetailSessionsSection";
import { useStudentDetailModel } from "@/tenant/features/students/components/useStudentDetailModel";

export interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  canDelete?: boolean;
  onRestore?: (studentId: string) => void | Promise<void>;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export default function StudentDetail({
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
    primaryPhone,
    primaryEmail,
    hasVisibleDetailFields,
    showNotesSection,
  } = useStudentDetailModel(student);

  const isArchived = Boolean(student.deletedAt);

  const headerActions = (
    <DetailDrawerRestoreOrEditAction
      isArchived={isArchived}
      canRestore={canDelete}
      canEdit={Boolean(onEdit)}
      restoreLabel={t("students.restore")}
      editLabel={t("students.detail.editTitle")}
      onRestore={onRestore ? () => onRestore(String(student.id)) : undefined}
      onEdit={onEdit ? () => onEdit(student) : undefined}
    />
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
      ariaLabel={t("students.detail.ariaLabel")}
      headerActions={headerActions}
      headerExtra={<StudentArchivedBanner student={student} />}
      footer={
        <DrawerSyncStatusFooter
          isArchived={isArchived}
          archivedLabel={t("students.detail.archivedSubtitle")}
          syncedLabel={t("students.detail.synced")}
        />
      }
    >
      <StudentDetailHero student={student} statusBadgeConfig={statusBadgeConfig} />

      {!isArchived && canWriteMessaging && (
        <StudentDetailQuickActions
          student={student}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
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

      <StudentDetailSessionsSection sessions={enrolledSessionDetails} />
    </DetailDrawerShell>
  );
}
