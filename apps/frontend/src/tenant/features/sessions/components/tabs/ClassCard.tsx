import { Edit2, MessageCircle, MessageSquare, Trash2, Users } from "lucide-react";
import type { Teacher } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { useTranslation } from "@/hooks/useTranslation";
import type { Class } from "@/lib/data/sessionsData";
import { genderStatusBadgeConfig } from "@/lib/genderStatusBadge";
import { teacherNameById } from "@/lib/teachers/teacherAssignment";

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
  const capacityPercent = Math.round((sessionClass.enrolled / sessionClass.capacity) * 100);
  const barColor = capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success";
  const teacherLabel = teacherNameById(teachers, sessionClass.teacherId) || sessionClass.teacherName || t("sessions.classes.unassigned");
  const genderConfig: Record<string, StatusBadgeConfigItem> = genderStatusBadgeConfig(t, { includeAny: true });

  return (
    <DirectoryEntityCard className="group p-4 flex flex-col justify-between">
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
        />

        <div className="mb-3 mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="m-0 text-xs font-medium text-muted-foreground">{t("sessions.classes.ageRange")}</p>
            <p className="m-0 text-sm font-semibold text-foreground">
              {t("sessions.classes.ageYears", { min: sessionClass.ageMin, max: sessionClass.ageMax })}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="m-0 text-xs font-medium text-muted-foreground">{t("sessions.classes.form.gender")}</p>
            <StatusBadge status={sessionClass.gender || "any"} config={genderConfig} size="sm" />
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {t("sessions.classes.teacher")}: <span className="font-medium text-foreground">{teacherLabel}</span>
          </span>
        </div>

        <div aria-label={t("sessions.classes.enrolledCapacity", { enrolled: sessionClass.enrolled, capacity: sessionClass.capacity })}>
          <div className="mb-1 flex items-center justify-between" aria-hidden="true">
            <span className="text-xs text-muted-foreground">{t("sessions.classes.form.capacity")}</span>
            <span className="text-xs font-semibold text-foreground">
              {sessionClass.enrolled}/{sessionClass.capacity}
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

      {canWrite && (
        <DirectoryCardFooter
          trailing={
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
                onClick={() => onMessage?.("whatsapp", sessionClass)}
                className="h-8 w-8 rounded-lg text-success transition-colors hover:bg-muted hover:text-success"
                title={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.messageSms", { name: sessionClass.name })}
                onClick={() => onMessage?.("sms", sessionClass)}
                className="h-8 w-8 rounded-lg text-info transition-colors hover:bg-muted hover:text-info"
                title={t("sessions.classes.messageSms", { name: sessionClass.name })}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.editNamed", { name: sessionClass.name })}
                onClick={() => onEdit(sessionClass)}
                className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sessions.classes.deleteNamed", { name: sessionClass.name })}
                onClick={() => onDelete(sessionClass.id)}
                className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          }
        />
      )}
    </DirectoryEntityCard>
  );
}
