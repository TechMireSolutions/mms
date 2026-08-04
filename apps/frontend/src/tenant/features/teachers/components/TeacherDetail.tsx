import React, { lazy, Suspense, useMemo, useState } from "react";
import {
  Archive,
  Briefcase,
  Calendar,
  Edit2,
  GraduationCap,
  Hash,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  School,
  User,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { WarningCallout } from "@/components/ui/WarningCallout";
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

function formatTeacherStamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
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
  const [restoring, setRestoring] = useState(false);

  const isArchived = Boolean(teacher.deletedAt);
  const archivedAt = formatTeacherStamp(teacher.deletedAt);

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
                await onRestore(String(teacher.id));
              } finally {
                setRestoring(false);
              }
            })();
          }}
          className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={t("teachers.restore")}
          aria-label={t("teachers.restore")}
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
          onClick={() => onEdit(teacher)}
          className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={t("teachers.detail.editTitle")}
          aria-label={t("teachers.detail.editTitle")}
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
        headerExtra={
          isArchived && archivedAt ? (
            <WarningCallout
              icon={Archive}
              density="compact"
              role="status"
              description={t("teachers.detail.archivedBanner", {
                date: formatDate(archivedAt),
              })}
            />
          ) : undefined
        }
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
