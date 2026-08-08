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
import { DetailDrawerRestoreOrEditAction, DrawerSyncStatusFooter } from "@/components/ui/DetailDrawerArchiveChrome";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { type Teacher } from "@mms/shared";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailAttributeRow } from "@/tenant/features/teachers/components/TeacherDetailAttributeRow";
import { TeacherDetailHero } from "@/tenant/features/teachers/components/TeacherDetailHero";
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
  const { settings, isFieldEnabled } = useTeacherConfig();
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

  const statusConfig = useTeacherStatusConfig();

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
          <DrawerSyncStatusFooter
            isArchived={isArchived}
            archivedLabel={t("teachers.detail.archivedSubtitle")}
            syncedLabel={t("teachers.detail.synced")}
          />
        }
      >
        <TeacherDetailHero
          teacher={teacher}
          displayName={displayName}
          statusConfig={statusConfig}
          showStatus={isFieldEnabled("status")}
        />

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
          <DetailSectionTitle className="mb-2">
            {t("teachers.detail.sectionDetails")}
          </DetailSectionTitle>
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
