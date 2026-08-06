import React, { lazy, Suspense } from "react";
import { GraduationCap } from "lucide-react";
import type { Student } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
} from "@/components/ui/DetailDrawerArchiveChrome";
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
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

export default function StudentDetail({
  student,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: StudentDetailProps): React.JSX.Element {
  const {
    t,
    statusBadgeConfig,
    messagingTarget,
    openComposer,
    closeComposer,
    canWriteMessaging,
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
    <>
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
        headerExtra={
          <DetailDrawerArchivedBanner
            deletedAt={student.deletedAt}
            describe={(date) => t("students.detail.archivedBanner", { date })}
          />
        }
        footer={
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isArchived ? "bg-warning" : "bg-success"}`} />
            <span className={`text-xs font-bold uppercase ${isArchived ? "text-warning" : "text-success"}`}>
              {isArchived ? t("students.detail.archivedSubtitle") : t("students.detail.synced")}
            </span>
          </div>
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

      {messagingTarget && !isArchived && canWriteMessaging && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </>
  );
}
