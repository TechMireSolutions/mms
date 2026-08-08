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
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import {
  formatDate,
  getPrimaryEmail,
  getPrimaryPhone,
  toTitleCase,
  type AppTranslationKey,
  type Teacher,
} from "@mms/shared";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailAttributeRow } from "@/tenant/features/teachers/components/TeacherDetailAttributeRow";
import { TeacherDetailQuickActions } from "@/tenant/features/teachers/components/TeacherDetailQuickActions";

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  canDelete?: boolean;
  onRestore?: (teacherId: string) => void | Promise<void>;
}

export default function TeacherDetail({
  teacher,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { statuses, settings } = useTeacherConfig();
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const { data: linkedContact } = useContactById(
    teacher.contactId ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );

  const isArchived = Boolean(teacher.deletedAt);

  const displayName = teacher.name || linkedContact?.name || t("teachers.contactMissing");
  const primaryPhone = (linkedContact ? getPrimaryPhone(linkedContact) : null) || teacher.phone;
  const primaryEmail = (linkedContact ? getPrimaryEmail(linkedContact) : null) || teacher.email;

  const statusConfig = useMemo(() => {
    const configByStatus: Record<string, { label: string; cls: string }> = {};
    const statusValues = statuses.length > 0 ? statuses : ["active", "inactive", "on_leave"];
    for (const statusValue of statusValues) {
      const translationKey = `teachers.status.${statusValue}` as AppTranslationKey;
      const translated = t(translationKey);
      const label = translated === translationKey ? toTitleCase(statusValue) : translated;
      let cls: string = SEMANTIC_BADGE.muted;
      if (statusValue === "active") cls = SEMANTIC_BADGE.success;
      else if (statusValue === "on_leave") cls = SEMANTIC_BADGE.warning;
      configByStatus[statusValue] = { label, cls };
    }
    return configByStatus;
  }, [statuses, t]);

  const customFields = settings.customFields ?? [];

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
              <StatusBadge status={teacher.status || "active"} config={statusConfig} />
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {t("teachers.detail.sectionDetails")}
          </h4>
          <TeacherDetailAttributeRow icon={User} label={t("teachers.field.contact")} value={displayName} />
          <TeacherDetailAttributeRow icon={Hash} label={t("teachers.field.employeeId")} value={teacher.employeeId} />
          <TeacherDetailAttributeRow icon={Briefcase} label={t("teachers.field.specialization")} value={teacher.specialization} />
          <TeacherDetailAttributeRow icon={GraduationCap} label={t("teachers.field.qualification")} value={teacher.qualification} />
          <TeacherDetailAttributeRow
            icon={Calendar}
            label={t("teachers.field.joinDate")}
            value={teacher.joinDate ? formatDate(teacher.joinDate) : undefined}
          />
          {primaryPhone && (
            <TeacherDetailAttributeRow icon={Phone} label={t("teachers.field.phone")} value={primaryPhone} />
          )}
          {primaryEmail && (
            <TeacherDetailAttributeRow icon={Mail} label={t("teachers.field.email")} value={primaryEmail} />
          )}
          {teacher.notes && (
            <TeacherDetailAttributeRow icon={School} label={t("teachers.field.notes")} value={teacher.notes} />
          )}
          {customFields.map((field) => {
            const raw = (teacher as unknown as Record<string, unknown>)[field.id];
            let displayValue: string | undefined;
            if (raw !== undefined && raw !== null && raw !== "") {
              displayValue = typeof raw === "boolean"
                ? (raw ? t("common.yes") : t("common.no"))
                : String(raw);
            }
            return (
              <TeacherDetailAttributeRow
                key={field.id}
                icon={School}
                label={field.label || field.id}
                value={displayValue}
              />
            );
          })}
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
