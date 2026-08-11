import React, { useMemo } from "react";
import {
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import { formatDate, type Teacher } from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18nFormat";
import { formatEntityStamp } from "@/lib/formatEntityStamp";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import { teacherFieldLabelKey } from "@mms/shared";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailAttributeRow } from "@/tenant/features/teachers/components/TeacherDetailAttributeRow";
import { TeacherDetailHero } from "@/tenant/features/teachers/components/TeacherDetailHero";
import { TeacherDetailNotesSection } from "@/tenant/features/teachers/components/TeacherDetailNotesSection";
import { TeacherDetailQuickActions } from "@/tenant/features/teachers/components/TeacherDetailQuickActions";
import {
  resolveTeacherDisplayName,
  resolveTeacherFieldDisplayText,
} from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { useTeacherDetailModel } from "@/tenant/features/teachers/components/useTeacherDetailModel";

interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  canDelete?: boolean;
  onRestore?: (teacherId: string) => void | Promise<void>;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

const SYSTEM_FIELD_ICONS: Record<string, LucideIcon> = {
  contactId: User,
  employeeId: Hash,
  specialization: Briefcase,
  qualification: GraduationCap,
  joinDate: Calendar,
  status: Briefcase,
};

export default function TeacherDetail({
  teacher,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
  openComposer,
  canWriteMessaging,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { isFieldEnabled } = useTeacherConfig();
  const {
    statusConfig,
    detailFields,
    linkedContact,
    primaryPhone,
    primaryEmail,
    hasVisibleDetailFields,
  } = useTeacherDetailModel(teacher);

  const isArchived = Boolean(teacher.deletedAt);
  const emptyDash = t("teachers.table.emptyDash");

  const displayName = resolveTeacherDisplayName(teacher, t, linkedContact);
  const stamp = formatEntityStamp(teacher.updatedAt) || formatEntityStamp(teacher.createdAt);

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

  const fieldsCard = useMemo(() => {
    if (!hasVisibleDetailFields) return null;

    const mutedDash = <span className="text-muted-foreground/40">{emptyDash}</span>;

    const rows: React.ReactNode[] = detailFields
      .filter((field) => field.key !== "status" && field.key !== "notes")
      .map((field) => {
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
        return (
          <TeacherDetailAttributeRow
            key={field.key}
            icon={icon}
            label={label}
            value={displayValue || mutedDash}
          />
        );
      });

    if (teacher.gender) {
      rows.push(
        <TeacherDetailAttributeRow
          key="gender"
          icon={getGenderIcon(teacher.gender)}
          iconClassName={getGenderIconClass(teacher.gender)}
          label={t(teacherFieldLabelKey("gender"))}
          value={formatContactGenderLabel(teacher.gender, t)}
        />,
      );
    }

    if (primaryPhone) {
      rows.push(
        <TeacherDetailAttributeRow
          key="phone"
          icon={Phone}
          label={t(teacherFieldLabelKey("phone"))}
          value={primaryPhone}
        />,
      );
    }
    if (primaryEmail) {
      rows.push(
        <TeacherDetailAttributeRow
          key="email"
          icon={Mail}
          label={t(teacherFieldLabelKey("email"))}
          value={primaryEmail}
        />,
      );
    }

    return (
      <Card accentColor="primary" className="p-4">
        <DetailSectionTitle className="mb-2">
          {t("teachers.detail.sectionDetails")}
        </DetailSectionTitle>
        {rows}
      </Card>
    );
  }, [detailFields, displayName, emptyDash, hasVisibleDetailFields, primaryEmail, primaryPhone, t, teacher]);

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
      headerActions={headerActions}
      headerExtra={<TeacherArchivedBanner teacher={teacher} />}
      footer={
        stamp ? (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Clock className="w-3 h-3" aria-hidden />
            <span>
              {t("teachers.detail.updatedLabel")} {formatDate(stamp)}
            </span>
          </div>
        ) : null
      }
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
          canWriteMessaging={canWriteMessaging}
          onOpenComposer={openComposer}
        />
      )}

      {fieldsCard}

      {teacher.notes && (
        <TeacherDetailNotesSection notes={teacher.notes} />
      )}
    </DetailDrawerShell>
  );
}
