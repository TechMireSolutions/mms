import React, { lazy, Suspense } from "react";
import { GraduationCap } from "lucide-react";
import type { Student } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
  formatArchivedBannerDate,
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
    fatherContact,
    motherContact,
    guardianContact,
    fatherName,
    motherName,
    guardianName,
    age,
    enrolledSessionDetails,
    primaryPhone,
    primaryEmail,
    fatherPhone,
    motherPhone,
    guardianPhone,
    hasVisibleDetailFields,
  } = useStudentDetailModel(student);

  const isArchived = Boolean(student.deletedAt);
  const archivedDate = formatArchivedBannerDate(student.deletedAt);

  const headerActions = (
    <DetailDrawerRestoreOrEditAction
      isArchived={isArchived}
      canRestore={canDelete}
      canEdit={Boolean(onEdit)}
      restoreLabel={t("students.restore")}
      editLabel={t("students.detail.editTitle")}
      onRestore={onRestore ? () => onRestore(String(student.id)) : undefined}
      onEdit={onEdit ? () => onEdit(student) : undefined}
      className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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
          isArchived && archivedDate ? (
            <DetailDrawerArchivedBanner
              deletedAt={student.deletedAt}
              description={t("students.detail.archivedBanner", { date: archivedDate })}
            />
          ) : undefined
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
            student={{
              ...student,
              fatherContactId: fatherContact?.id != null ? String(fatherContact.id) : student.fatherContactId,
              motherContactId: motherContact?.id != null ? String(motherContact.id) : student.motherContactId,
              guardianContactId: guardianContact?.id != null ? String(guardianContact.id) : student.guardianContactId,
              fatherName: fatherName || student.fatherName,
              motherName: motherName || student.motherName,
              guardianName: guardianName || student.guardianName,
            }}
            sortedEnabledFields={sortedEnabledFields}
            age={age}
            fatherContact={fatherContact}
            motherContact={motherContact}
            guardianContact={guardianContact}
            fatherPhone={fatherPhone}
            motherPhone={motherPhone}
            guardianPhone={guardianPhone}
            openComposer={openComposer}
            messagingEnabled={!isArchived && canWriteMessaging}
          />
        )}

        {student.notes && <StudentDetailNotesSection notes={student.notes} />}

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
