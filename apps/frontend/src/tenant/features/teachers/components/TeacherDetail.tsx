import React, { lazy, Suspense, useMemo } from "react";
import {
  Briefcase, Calendar, Edit2, GraduationCap, Hash, Mail, MessageCircle,
  MessageSquare, Phone, School, User,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Button } from "@/components/ui/button";
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
  toMessagingRecipient,
  toTitleCase,
  type AppTranslationKey,
  type Teacher,
} from "@mms/shared";
import { useContactById } from "@/tenant/features/contacts/hooks/useContacts";

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

function cleanTelUri(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
}

function AttributeRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground mt-0.5 break-words">{value || t("common.notSpecified")}</div>
      </div>
    </div>
  );
}

export default function TeacherDetail({
  teacher,
  onClose,
  onEdit,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { statuses, settings } = useTeacherConfig();
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const { data: linkedContact } = useContactById(
    teacher.contactId ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );

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

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title={t("teachers.detail.title")}
        subtitle={t("teachers.detail.employeeSubtitle", {
          id: teacher.employeeId || t("common.notSpecified"),
        })}
        icon={School}
        ariaLabel={t("teachers.detail.ariaLabel")}
        headerActions={
          onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onEdit(teacher)}
              className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("teachers.detail.editTitle")}
              aria-label={t("teachers.detail.editTitle")}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        footer={
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[9px] font-bold text-success uppercase">{t("teachers.detail.synced")}</span>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {primaryPhone && (
            <Button
              variant="ghost"
              asChild
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center shadow-none"
            >
              <a href={cleanTelUri(primaryPhone)}>
                <Phone className="w-4 h-4 mx-auto" />
                <span className="text-[10px] font-bold">{t("teachers.detail.call")}</span>
              </a>
            </Button>
          )}
          {primaryPhone && canWriteMessaging && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("whatsapp", [toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer shadow-none"
            >
              <MessageCircle className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("teachers.list.actionWhatsApp")}</span>
            </Button>
          )}
          {primaryPhone && canWriteMessaging && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("sms", [toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center cursor-pointer shadow-none"
            >
              <MessageSquare className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("teachers.list.actionSms")}</span>
            </Button>
          )}
          {primaryEmail && canWriteMessaging && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("email", [toMessagingRecipient({ ...teacher, email: primaryEmail, name: displayName })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all text-primary text-center cursor-pointer shadow-none"
            >
              <Mail className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("teachers.list.actionEmail")}</span>
            </Button>
          )}
        </div>

        <Card accentColor="primary" className="p-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {t("teachers.detail.sectionDetails")}
          </h4>
          <AttributeRow icon={User} label={t("teachers.field.contact")} value={displayName} />
          <AttributeRow icon={Hash} label={t("teachers.field.employeeId")} value={teacher.employeeId} />
          <AttributeRow icon={Briefcase} label={t("teachers.field.specialization")} value={teacher.specialization} />
          <AttributeRow icon={GraduationCap} label={t("teachers.field.qualification")} value={teacher.qualification} />
          <AttributeRow
            icon={Calendar}
            label={t("teachers.field.joinDate")}
            value={teacher.joinDate ? formatDate(teacher.joinDate) : undefined}
          />
          {primaryPhone && (
            <AttributeRow icon={Phone} label={t("teachers.field.phone")} value={primaryPhone} />
          )}
          {primaryEmail && (
            <AttributeRow icon={Mail} label={t("teachers.field.email")} value={primaryEmail} />
          )}
          {teacher.notes && (
            <AttributeRow icon={School} label={t("teachers.field.notes")} value={teacher.notes} />
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
              <AttributeRow
                key={field.id}
                icon={School}
                label={field.label || field.id}
                value={displayValue}
              />
            );
          })}
        </Card>
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
