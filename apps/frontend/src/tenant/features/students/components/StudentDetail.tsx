import React, { lazy, Suspense, useState } from "react";
import { Archive, Edit2, GraduationCap, Loader2, RotateCcw } from "lucide-react";
import { formatDate, type Student } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
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

function formatStudentStamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

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

  const [restoring, setRestoring] = useState(false);
  const isArchived = Boolean(student.deletedAt);
  const archivedAt = formatStudentStamp(student.deletedAt);

  const headerActions = (() => {
    if (isArchived && canDelete && onRestore) {
      return (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={restoring}
          onClick={() => {
            void (async () => {
              setRestoring(true);
              try {
                await onRestore(String(student.id));
              } finally {
                setRestoring(false);
              }
            })();
          }}
          className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={t("students.restore")}
          aria-label={t("students.restore")}
          aria-busy={restoring}
        >
          {restoring ? (
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </Button>
      );
    }

    if (onEdit && !isArchived) {
      return (
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
      );
    }

    return undefined;
  })();

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
          isArchived && archivedAt ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs font-medium text-foreground"
            >
              <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
              <span>
                {t("students.detail.archivedBanner", {
                  date: formatDate(archivedAt),
                })}
              </span>
            </div>
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

        {!isArchived && (
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
            fatherContact={fatherContact}
            motherContact={motherContact}
            guardianContact={guardianContact}
            fatherPhone={fatherPhone}
            motherPhone={motherPhone}
            guardianPhone={guardianPhone}
            openComposer={openComposer}
            messagingEnabled={!isArchived}
          />
        )}

        {student.notes && <StudentDetailNotesSection notes={student.notes} />}

        <StudentDetailSessionsSection sessions={enrolledSessionDetails} />
      </DetailDrawerShell>

      {messagingTarget && !isArchived && (
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
