import { Edit2, MessageCircle, MessageSquare, Trash2, Users, DollarSign, Clock } from "lucide-react";
import type { Teacher } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { useTranslation } from "@/hooks/useTranslation";
import type { Class } from "@/lib/data/sessionsData";
import { genderStatusBadgeConfig } from "@/lib/genderStatusBadge";
import { teacherNameById } from "@/lib/faculty/facultyAssignment";

interface ClassCardProps {
  sessionClass: Class;
  teachers: Teacher[];
  onEdit: (sessionClass: Class) => void;
  onDelete: (id: string) => void;
  onMessage?: (channel: "sms" | "whatsapp" | "email", sessionClass: Class) => void;
  canWrite: boolean;
}

export function ClassCard({ sessionClass, teachers, onEdit, onDelete, onMessage, canWrite }: ClassCardProps) {
  const { t } = useTranslation();
  const rawClass = sessionClass as unknown as Record<string, unknown>;
  const maxCapacity = sessionClass.maxStudents ?? (typeof rawClass.capacity === "number" ? rawClass.capacity : 30);
  const enrolledCount = sessionClass.enrolled ?? 0;
  const capacityPercent = Math.round((enrolledCount / Math.max(1, maxCapacity)) * 100);
  const barColor = capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success";
  const teacherLabel = teacherNameById(teachers, sessionClass.teacherId) || sessionClass.teacherName || t("sessions.classes.unassigned");
  const genderConfig: Record<string, StatusBadgeConfigItem> = genderStatusBadgeConfig(t, { includeAny: true });

  const minAge = sessionClass.minAge ?? (typeof rawClass.ageMin === "number" ? rawClass.ageMin : 5);
  const maxAge = sessionClass.maxAge ?? (typeof rawClass.ageMax === "number" ? rawClass.ageMax : 18);

  const feeCount = sessionClass.fees?.length ?? 0;
  const scheduleCount = sessionClass.schedules?.length ?? 0;

  const { onView: handleView, cardProps } = useWorkCardAction({
    entity: sessionClass,
    selectedIds: [],
    canSelect: false,
    onView: canWrite ? () => onEdit(sessionClass) : undefined,
  });

  return (
    <DirectoryEntityCard
      className="group p-4 flex flex-col justify-between hover:border-primary/50 transition-all"
      {...cardProps}
    >
      <div>
        <DirectoryCardHeader
          id={sessionClass.id}
          displayName={sessionClass.name}
          subtitle={
            <p className="m-0 truncate text-xs text-muted-foreground">
              {sessionClass.room || t("sessions.classes.noRoom")}
            </p>
          }
          isSelected={false}
          onSelect={() => {}}
          selectAriaLabel=""
          showSelect={false}
          onView={canWrite ? handleView : undefined}
          viewAriaLabel={t("sessions.classes.editNamed", { name: sessionClass.name })}
        />

        <DirectoryCardMetaGrid className="mb-3 mt-4">
          <DirectoryCardMetaTile label={t("sessions.classes.ageRange")}>
            <span className="font-semibold text-foreground">
              {t("sessions.classes.ageYears", { min: minAge, max: maxAge })}
            </span>
          </DirectoryCardMetaTile>
          <DirectoryCardMetaTile label={t("sessions.classes.form.gender")}>
            <StatusBadge status={sessionClass.gender || "mixed"} config={genderConfig} size="sm" />
          </DirectoryCardMetaTile>
        </DirectoryCardMetaGrid>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {t("sessions.classes.teacher")}: <span className="font-medium text-foreground">{teacherLabel}</span>
          </span>
        </div>

        {/* Badges strip */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            {feeCount > 0 ? `${feeCount} Fees` : 'No Fees set'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {(sessionClass.timetables?.[0]?.periods?.length ?? 0)} Periods
          </span>
          {sessionClass.scholarships && sessionClass.scholarships.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 text-secondary px-2 py-0.5 text-xs font-medium">
              Scholarship: {sessionClass.scholarships[0]?.percentage}%
            </span>
          )}
        </div>

        {/*
          The capacity figures must reach assistive tech as TEXT. Announcing the visible text
          is the reliable fix; the bar below stays aria-hidden so the same number is not announced twice.
        */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("sessions.classes.form.capacity")}</span>
            <span className="text-xs font-semibold text-foreground">
              {enrolledCount}/{maxCapacity}
            </span>
          </div>
          <ProgressBar
            value={Math.min(capacityPercent, 100)}
            fillClassName={barColor}
            trackClassName="bg-border"
            aria-hidden="true"
          />
        </div>
      </div>

      <DirectoryCardFooterActions
        actions={
          canWrite ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
                onClick={() => onMessage?.("whatsapp", sessionClass)}
                className="min-h-11 min-w-11 rounded-lg text-success transition-colors hover:bg-muted hover:text-success"
                title={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.messageSms", { name: sessionClass.name })}
                onClick={() => onMessage?.("sms", sessionClass)}
                className="min-h-11 min-w-11 rounded-lg text-info transition-colors hover:bg-muted hover:text-info"
                title={t("sessions.classes.messageSms", { name: sessionClass.name })}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.editNamed", { name: sessionClass.name })}
                onClick={() => onEdit(sessionClass)}
                className="min-h-11 min-w-11 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.deleteNamed", { name: sessionClass.name })}
                onClick={() => onDelete(sessionClass.id)}
                className="min-h-11 min-w-11 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null
        }
      />
    </DirectoryEntityCard>
  );
}
