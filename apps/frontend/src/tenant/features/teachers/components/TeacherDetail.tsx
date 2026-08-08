import React, { lazy, Suspense, useMemo } from "react";
import {
  Briefcase,
  Calendar,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { teacherStatusBadgeConfig } from "@/lib/teachers/teacherStatusUi";
import {
  DEFAULT_TEACHER_STATUS,
  type Teacher,
} from "@mms/shared";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailAttributeRow } from "@/tenant/features/teachers/components/TeacherDetailAttributeRow";
import {
  resolveTeacherDisplayName,
  resolveTeacherFieldDisplayText,
} from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { listTeacherDetailAttributeFields } from "@/tenant/features/teachers/components/teacherDetailFields";
import { TeacherDetailQuickActions } from "@/tenant/features/teachers/components/TeacherDetailQuickActions";

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  canDelete?: boolean;
  onRestore?: (teacherId: string) => void | Promise<void>;
}

const SYSTEM_FIELD_ICONS: Record<string, LucideIcon> = {
  contactId: User,
  employeeId: Hash,
  specialization: Briefcase,
  qualification: GraduationCap,
  joinDate: Calendar,
  notes: School,
  status: Briefcase,
};

export default function TeacherDetail({
  teacher,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { statuses, settings, isFieldEnabled } = useTeacherConfig();
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const { data: linkedContact } = useContactById(
    teacher.contactId ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );

  const isArchived = Boolean(teacher.deletedAt);

  const displayName = resolveTeacherDisplayName(teacher, t, linkedContact);
  const { phone: primaryPhone, email: primaryEmail } = resolveTeacherPrimaryChannels(
    teacher,
    linkedContact,
  );

  const statusConfig = useMemo(
    () => teacherStatusBadgeConfig(t, statuses),
    [statuses, t],
  );

  const detailFields = useMemo(
    () => listTeacherDetailAttributeFields(settings),
    [settings],
  );

  const headerActions = (
    <DetailDrawerRestoreOrEditAction
      isArchived={isArchived}
      canRestore={canDelete}
      canEdit={Boolean(onEdit)}
      restoreLabel={t("teachers.restore")}
      editLabel={t("teachers.detail.editTitle")}
      onRestore={onRestore ? () => onRestore(String(teacher.id)) : undefined}
      onEdit={onEdit ? () => onEdit(teacher) : undefined}
    />
  );

  return (
    <>
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
        ariaLabel={t("teachers.detail.ariaLabel")}
        headerActions={headerActions}
        headerExtra={<TeacherArchivedBanner teacher={teacher} />}
        footer={
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isArchived ? "bg-warning" : "bg-success"}`} />
            <span className={`text-xs font-bold uppercase ${isArchived ? "text-warning" : "text-success"}`}>
              {isArchived ? t("teachers.detail.archivedSubtitle") : t("teachers.detail.synced")}
            </span>
          </div>
        }
      >
        <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-muted/35 border border-border/50 shadow-sm">
          <UserAvatar id={String(teacher.id)} name={displayName} className="w-14 h-14 rounded-2xl text-xl font-bold flex-shrink-0 shadow-sm" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate leading-tight">{displayName}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              {isFieldEnabled("status") ? (
                <StatusBadge status={teacher.status || DEFAULT_TEACHER_STATUS} config={statusConfig} />
              ) : null}
            </div>
          </div>
        </div>

        {!isArchived && (
          <TeacherDetailQuickActions
            teacher={teacher}
            displayName={displayName}
            primaryPhone={primaryPhone}
            primaryEmail={primaryEmail}
            canWriteMessaging={canWriteMessaging}
            onOpenComposer={openComposer}
          />
        )}

        <Card accentColor="primary" className="p-4">
          <h4 className={`${DETAIL_SECTION_TITLE} mb-2`}>
            {t("teachers.detail.sectionDetails")}
          </h4>
          {detailFields.map((field) => {
            if (field.key === "status") return null;

            const label = resolveRegistryLabel(field, t);
            const icon = field.isCustom
              ? School
              : (SYSTEM_FIELD_ICONS[field.key] ?? School);
            const displayValue = resolveTeacherFieldDisplayText(teacher, field.key, {
              t,
              displayName,
              customFieldLabel: field.label,
              customFieldType: field.type,
              isCustom: field.isCustom,
            });
            if (field.key === "notes" && !displayValue) return null;

            return (
              <TeacherDetailAttributeRow
                key={field.key}
                icon={icon}
                label={label}
                value={displayValue}
              />
            );
          })}
          {primaryPhone && (
            <TeacherDetailAttributeRow icon={Phone} label={t("teachers.field.phone")} value={primaryPhone} />
          )}
          {primaryEmail && (
            <TeacherDetailAttributeRow icon={Mail} label={t("teachers.field.email")} value={primaryEmail} />
          )}
        </Card>
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
