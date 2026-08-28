import React, { useMemo } from "react";
import { IdCard, School } from "lucide-react";
import type { Teacher } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailFieldsSection } from "@/tenant/features/teachers/components/TeacherDetailFieldsSection";
import { TeacherDetailHero } from "@/tenant/features/teachers/components/TeacherDetailHero";
import { TeacherDetailNotesSection } from "@/tenant/features/teachers/components/TeacherDetailNotesSection";
import { TeacherDetailQuickActions } from "@/tenant/features/teachers/components/TeacherDetailQuickActions";
import { TeacherDetailSessionsSection } from "@/tenant/features/teachers/components/TeacherDetailSessionsSection";
import {
  resolveTeacherDisplayName,
} from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { useTeacherDetailModel } from "@/tenant/features/teachers/components/useTeacherDetailModel";

export interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  canDelete?: boolean;
  onRestore?: (teacherId: string) => void | Promise<void>;
  onPrintIdCard?: (teacher: Teacher) => void;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export const TeacherDetail = React.memo(function TeacherDetail({
  teacher,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
  onPrintIdCard,
  openComposer,
  canWriteMessaging,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, isFieldEnabled } = useTeacherConfig();
  const {
    statusConfig,
    detailFields,
    linkedContact,
    primaryPhone,
    primaryEmail,
    hasWhatsAppContact,
    hasVisibleDetailFields,
    assignedClasses,
    sessionsLoading,
    sessionsError,
  } = useTeacherDetailModel(teacher);

  const isArchived = Boolean(teacher.deletedAt);
  const displayName = resolveTeacherDisplayName(teacher, t, linkedContact);

  const headerActionsNode = useMemo(
    () => (
      <div className="flex items-center gap-1.5">
        {!isArchived && onPrintIdCard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPrintIdCard(teacher)}
            className="min-h-11 px-3 gap-1.5 font-medium text-xs border-border/60 hover:bg-muted/80"
            title={t("teachers.detail.printIdCard")}
            aria-label={t("teachers.detail.printIdCard")}
          >
            <IdCard className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">{t("teachers.detail.printIdCard")}</span>
          </Button>
        )}
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canRestore={canDelete}
          canEdit={Boolean(onEdit)}
          restoreLabel={t("teachers.restore")}
          editLabel={t("teachers.detail.editTitle")}
          onRestore={onRestore ? () => onRestore(String(teacher.id)) : undefined}
          onEdit={onEdit ? () => onEdit(teacher) : undefined}
        />
      </div>
    ),
    [isArchived, onPrintIdCard, canDelete, onEdit, t, onRestore, teacher],
  );

  const headerExtraNode = useMemo(
    () => <TeacherArchivedBanner teacher={teacher} />,
    [teacher],
  );

  const footerNode = useMemo(
    () => (
      <DrawerUpdatedStamp
        updatedAt={teacher.updatedAt}
        createdAt={teacher.createdAt}
        label={t("teachers.detail.updatedLabel")}
      />
    ),
    [teacher.updatedAt, teacher.createdAt, t],
  );

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t("teachers.detail.title")}
      subtitle={
        isArchived
          ? t("teachers.detail.archivedSubtitle")
          : t("teachers.detail.employeeSubtitle", {
              id: teacher.employeeId || t("common.notSpecified"),
            })
      }
      icon={School}
      ariaLabel={t("teachers.detail.ariaLabel", {
        name: displayName,
      })}
      headerActions={headerActionsNode}
      headerExtra={headerExtraNode}
      footer={footerNode}
    >
      <TeacherDetailHero
        teacher={teacher}
        displayName={displayName}
        avatar={linkedContact?.avatar ?? teacher.avatar}
        statusConfig={statusConfig}
        showStatus={isFieldEnabled("status")}
      />

      {!isArchived && canWriteMessaging && (
        <TeacherDetailQuickActions
          teacher={teacher}
          displayName={displayName}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          hasWhatsAppContact={hasWhatsAppContact}
          canWriteMessaging={canWriteMessaging}
          onOpenComposer={openComposer}
        />
      )}

      {hasVisibleDetailFields && (
        <TeacherDetailFieldsSection
          teacher={teacher}
          detailFields={detailFields}
          displayName={displayName}
          settings={settings}
        />
      )}

      <TeacherDetailSessionsSection
        assignedClasses={assignedClasses}
        loading={sessionsLoading}
        error={sessionsError}
      />

      {teacher.notes && isFieldEnabled("notes") && (
        <TeacherDetailNotesSection notes={teacher.notes} />
      )}
    </DetailDrawerShell>
  );
});

export default TeacherDetail;
