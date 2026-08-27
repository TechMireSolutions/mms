import React, { useMemo } from "react";
import { GraduationCap, IdCard } from "lucide-react";
import type { Student } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import { Button } from "@/components/ui/button";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StudentArchivedBanner } from "@/tenant/features/students/components/StudentArchivedBanner";
import { StudentDetailContactSection } from "@/tenant/features/students/components/StudentDetailContactSection";
import { StudentDetailFieldsSection } from "@/tenant/features/students/components/StudentDetailFieldsSection";
import { StudentDetailHero } from "@/tenant/features/students/components/StudentDetailHero";
import { StudentDetailNotesSection } from "@/tenant/features/students/components/StudentDetailNotesSection";
import { StudentDetailQuickActions } from "@/tenant/features/students/components/StudentDetailQuickActions";
import { StudentDetailRelationsSection } from "@/tenant/features/students/components/StudentDetailRelationsSection";
import { StudentDetailSessionsSection } from "@/tenant/features/students/components/StudentDetailSessionsSection";
import { StudentDetailSiblingsSection } from "@/tenant/features/students/components/StudentDetailSiblingsSection";
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
  onPrintIdCard?: (student: Student) => void;
  onViewStudent?: (student: Student) => void;
  onViewContact?: (contactId: string | number) => void;
}

export const StudentDetail = React.memo(function StudentDetail({
  student,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
  openComposer,
  canWriteMessaging,
  onPrintIdCard,
  onViewStudent,
  onViewContact,
}: StudentDetailProps): React.JSX.Element {
  const {
    t,
    statusBadgeConfig,
    sortedEnabledFields,
    relationshipLinks,
    hydratedRelationships,
    studentContactProfile,
    age,
    enrolledSessionDetails,
    sessionsLoading,
    sessionsError,
    primaryPhone,
    primaryEmail,
    hasWhatsAppContact,
    hasVisibleDetailFields,
    showNotesSection,
    siblings,
    allStudents,
  } = useStudentDetailModel(student);

  const isArchived = Boolean(student.deletedAt);

  const handleNavigateToContact = (contactId: string | number) => {
    if (onViewContact) {
      onViewContact(contactId);
    } else {
      window.location.assign("/contacts");
    }
  };

  const headerActionsNode = useMemo(
    () => (
      <div className="flex items-center gap-1.5">
        {!isArchived && onPrintIdCard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPrintIdCard(student)}
            className="min-h-11 px-3 gap-1.5 font-medium text-xs border-border/60 hover:bg-muted/80"
            title={t("students.detail.printIdCard")}
            aria-label={t("students.detail.printIdCard")}
          >
            <IdCard className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">{t("students.detail.printIdCard")}</span>
          </Button>
        )}
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canRestore={canDelete}
          canEdit={Boolean(onEdit)}
          restoreLabel={t("students.restore")}
          editLabel={t("students.detail.editTitle")}
          onRestore={onRestore ? () => onRestore(String(student.id)) : undefined}
          onEdit={onEdit ? () => onEdit(student) : undefined}
        />
      </div>
    ),
    [isArchived, onPrintIdCard, canDelete, onEdit, t, onRestore, student],
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

      {/* Linked Contact Details & Communication Channels */}
      <StudentDetailContactSection
        contactProfile={studentContactProfile}
        canMessage={!isArchived && canWriteMessaging}
        openComposer={openComposer}
        onNavigateToContact={handleNavigateToContact}
      />

      {/* All Family & Contact Network Relationships */}
      <StudentDetailRelationsSection
        relationships={hydratedRelationships}
        canMessage={!isArchived && canWriteMessaging}
        openComposer={openComposer}
        onNavigateToContact={handleNavigateToContact}
      />

      {hasVisibleDetailFields && (
        <StudentDetailFieldsSection
          student={student}
          sortedEnabledFields={sortedEnabledFields}
          age={age}
        />
      )}

      {showNotesSection && student.notes ? <StudentDetailNotesSection notes={student.notes} /> : null}

      <StudentDetailSiblingsSection
        siblings={siblings}
        statusBadgeConfig={statusBadgeConfig}
        onViewSibling={
          onViewStudent
            ? (siblingId) => {
                const target = allStudents.find((s: { id: string | number }) => String(s.id) === String(siblingId));
                if (target) onViewStudent(target as Student);
              }
            : undefined
        }
      />

      <StudentDetailSessionsSection
        sessions={enrolledSessionDetails}
        loading={sessionsLoading}
        error={sessionsError}
      />
    </DetailDrawerShell>
  );
});

export default StudentDetail;
