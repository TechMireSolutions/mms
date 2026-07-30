import React, { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, GraduationCap } from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import type { Student } from "@mms/shared";
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
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
  const {
    t,
    statusBadgeConfig,
    messagingTarget,
    openComposer,
    closeComposer,
    sortedEnabledFields,
    fatherContact,
    motherContact,
    guardianContact,
    age,
    enrolledSessionDetails,
    primaryPhone,
    primaryEmail,
    fatherPhone,
    motherPhone,
    guardianPhone,
    hasVisibleDetailFields,
  } = useStudentDetailModel(student);

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title={t("students.detail.title")}
        subtitle={t("students.detail.grSubtitle", { gr: student.grNumber || t("common.notSpecified") })}
        icon={GraduationCap}
        ariaLabel={t("students.detail.ariaLabel")}
        headerActions={
          onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onEdit(student)}
              className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("students.detail.editTitle")}
              aria-label={t("students.detail.editTitle")}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        footer={
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-bold text-success uppercase">{t("students.detail.synced")}</span>
          </div>
        }
      >
        <StudentDetailHero student={student} statusBadgeConfig={statusBadgeConfig} />

        <StudentDetailQuickActions
          student={student}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          openComposer={openComposer}
        />

        {hasVisibleDetailFields && (
          <StudentDetailFieldsSection
            student={student}
            sortedEnabledFields={sortedEnabledFields}
            age={age}
            fatherContact={fatherContact}
            motherContact={motherContact}
            guardianContact={guardianContact}
            fatherPhone={fatherPhone}
            motherPhone={motherPhone}
            guardianPhone={guardianPhone}
            openComposer={openComposer}
          />
        )}

        {student.notes && <StudentDetailNotesSection notes={student.notes} />}

        <StudentDetailSessionsSection sessions={enrolledSessionDetails} />
      </DetailDrawerShell>

      {messagingTarget && (
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
