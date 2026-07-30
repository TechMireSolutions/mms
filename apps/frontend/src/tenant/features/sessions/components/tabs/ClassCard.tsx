import { motion } from "framer-motion";
import { Edit2, GraduationCap, MessageCircle, MessageSquare, Trash2, Users } from "lucide-react";
import type { Teacher } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Class } from "@/lib/data/sessionsData";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
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
  const genderConfig: Record<string, StatusBadgeConfigItem> = {
    male: { label: t("sessions.classes.gender.male"), cls: SEMANTIC_BADGE.info },
    female: { label: t("sessions.classes.gender.female"), cls: SEMANTIC_BADGE.secondary },
    any: { label: t("sessions.classes.gender.any"), cls: SEMANTIC_BADGE.muted },
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
    >
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
            <GraduationCap className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <h4 className="m-0 truncate text-sm font-bold text-foreground">{sessionClass.name}</h4>
            <p className="m-0 truncate text-xs text-muted-foreground">{sessionClass.room || t("sessions.classes.noRoom")}</p>
          </div>
        </div>
        {canWrite && (
          <div className="flex shrink-0 items-center gap-1 self-end opacity-100 transition-opacity sm:self-start md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <Button variant="ghost" size="icon" aria-label={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })} onClick={() => onMessage?.("whatsapp", sessionClass)} className="rounded-lg text-success transition-colors hover:bg-muted hover:text-success" title={t("sessions.classes.messageWhatsApp", { name: sessionClass.name })}>
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("sessions.classes.messageSms", { name: sessionClass.name })} onClick={() => onMessage?.("sms", sessionClass)} className="rounded-lg text-info transition-colors hover:bg-muted hover:text-info" title={t("sessions.classes.messageSms", { name: sessionClass.name })}>
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("sessions.classes.editNamed", { name: sessionClass.name })} onClick={() => onEdit(sessionClass)} className="rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("sessions.classes.deleteNamed", { name: sessionClass.name })} onClick={() => onDelete(sessionClass.id)} className="rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </header>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="m-0 text-xs font-medium text-muted-foreground">{t("sessions.classes.ageRange")}</p>
          <p className="m-0 text-sm font-semibold text-foreground">{t("sessions.classes.ageYears", { min: sessionClass.ageMin, max: sessionClass.ageMax })}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="m-0 text-xs font-medium text-muted-foreground">{t("sessions.classes.form.gender")}</p>
          <StatusBadge status={sessionClass.gender || "any"} config={genderConfig} size="sm" />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t("sessions.classes.teacher")}: <span className="font-medium text-foreground">{teacherLabel}</span></span>
      </div>

      <div aria-label={t("sessions.classes.enrolledCapacity", { enrolled: sessionClass.enrolled, capacity: sessionClass.capacity })}>
        <div className="mb-1 flex items-center justify-between" aria-hidden="true">
          <span className="text-xs text-muted-foreground">{t("sessions.classes.form.capacity")}</span>
          <span className="text-xs font-semibold text-foreground">{sessionClass.enrolled}/{sessionClass.capacity}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
        </div>
      </div>
    </motion.article>
  );
}
