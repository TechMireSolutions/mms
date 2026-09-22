import React from "react";
import { IdCard, School } from "lucide-react";
import { hydrateTeacherFromContact, type FacultyMember, type Teacher } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useFacultyConfig } from "@/hooks/useStandardModuleConfig";
import { FacultyArchivedBanner } from "@/tenant/features/faculty/components/FacultyArchivedBanner";
import { FacultyDetailFieldsSection } from "@/tenant/features/faculty/components/FacultyDetailFieldsSection";
import { FacultyDetailHeroCard } from "@/tenant/features/faculty/components/FacultyDetailHeroCard";
import { FacultyDetailNotesSection } from "@/tenant/features/faculty/components/FacultyDetailNotesSection";
import { FacultyDetailQuickActions } from "@/tenant/features/faculty/components/FacultyDetailQuickActions";
import { FacultyDetailSessionsSection } from "@/tenant/features/faculty/components/FacultyDetailSessionsSection";
import {
  resolveTeacherDisplayName,
} from "@/tenant/features/faculty/components/facultyFieldDisplay";
import { useFacultyDetailModel } from "@/tenant/features/faculty/components/useFacultyDetailModel";

export interface FacultyDetailProps {
  faculty?: FacultyMember;
  teacher?: Teacher;
  onClose: () => void;
  onEdit?: (faculty: FacultyMember) => void;
  canDelete?: boolean;
  onRestore?: (id: string) => void | Promise<void>;
  onPrintIdCard?: (faculty: FacultyMember) => void;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export type TeacherDetailProps = FacultyDetailProps;

export const FacultyDetail = (function FacultyDetail(props: FacultyDetailProps): React.JSX.Element {
  const teacher = (props.faculty ?? props.teacher)!;
  const {
    onClose,
    onEdit,
    canDelete = false,
    onRestore,
    onPrintIdCard,
    openComposer,
    canWriteMessaging,
  } = props;
  const { t } = useTranslation();
  const { settings, isFieldEnabled } = useFacultyConfig();
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
  } = useFacultyDetailModel(teacher);

  const effectiveTeacher = React.useMemo(() => {
    if (!linkedContact) return teacher;
    return hydrateTeacherFromContact(teacher, [linkedContact]);
  }, [teacher, linkedContact]);

  const isArchived = Boolean(teacher.deletedAt);
  const displayName = resolveTeacherDisplayName(effectiveTeacher, t, linkedContact);

  const headerActionsNode = (() => (
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
    ))();

  const headerExtraNode = (() => <FacultyArchivedBanner teacher={teacher} />)();

  const footerNode = (() => (
      <DrawerUpdatedStamp
        updatedAt={teacher.updatedAt}
        createdAt={teacher.createdAt}
        label={t("teachers.detail.updatedLabel")}
      />
    ))();

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
      <FacultyDetailHeroCard
        teacher={effectiveTeacher}
        displayName={displayName}
        avatar={linkedContact?.avatar ?? effectiveTeacher.avatar}
        statusConfig={statusConfig}
        showStatus={isFieldEnabled("status")}
      />

      {!isArchived && canWriteMessaging && (
        <FacultyDetailQuickActions
          teacher={effectiveTeacher}
          displayName={displayName}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          hasWhatsAppContact={hasWhatsAppContact}
          canWriteMessaging={canWriteMessaging}
          onOpenComposer={openComposer}
        />
      )}

      {hasVisibleDetailFields && (
        <FacultyDetailFieldsSection
          teacher={effectiveTeacher}
          detailFields={detailFields}
          displayName={displayName}
          settings={settings}
        />
      )}

      <FacultyDetailSessionsSection
        assignedClasses={assignedClasses}
        loading={sessionsLoading}
        error={sessionsError}
      />

      {teacher.notes && isFieldEnabled("notes") && (
        <FacultyDetailNotesSection notes={teacher.notes} />
      )}
    </DetailDrawerShell>
  );
});

export const TeacherDetail = FacultyDetail;
export const FacultyDrawer = FacultyDetail;
export const TeacherDrawer = FacultyDetail;
export default FacultyDetail;


