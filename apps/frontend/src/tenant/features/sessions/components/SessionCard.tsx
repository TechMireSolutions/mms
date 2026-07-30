import { Calendar, ChevronRight, DollarSign, RotateCcw, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { formatDate, formatMoney } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Session } from "@/lib/data/sessionsData";

const MotionCard = motion.create(Card);

export interface SessionCardProps {
  session: Session;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  canDelete?: boolean;
  showDeleted?: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
}

export function SessionCard({
  session,
  onClick,
  onDelete,
  onRestore,
  canDelete,
  showDeleted,
  statusConfig,
  typeConfig,
}: SessionCardProps) {
  const { t } = useTranslation();
  const totalEnrolled = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.enrolled, 0) ?? 0;
  const totalCapacity = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.capacity, 0) ?? 0;
  const capacityPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const classCount = session.classes?.length ?? 0;

  const accentColor = session.status === "active"
    ? "success" as const
    : session.status === "upcoming"
    ? "info" as const
    : undefined;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      accentColor={accentColor}
      className="text-start w-full p-5 ps-6.5 hover:border-primary/40 group relative"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="w-full h-auto p-0 text-start font-normal hover:bg-transparent"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pe-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusBadge status={session.type || "other"} config={typeConfig} size="sm" />
              <StatusBadge status={session.status} config={statusConfig} size="sm" />
            </div>
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{session.name}</h3>
            {session.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
        </div>

        <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-3">
          {[
            { icon: Calendar, label: t("sessions.card.start"), value: formatDate(session.startDate, true) },
            { icon: Users, label: t("sessions.card.enrolled"), value: `${totalEnrolled}/${totalCapacity || t("common.notSpecified")}` },
            { icon: DollarSign, label: t("sessions.card.fee"), value: formatMoney(session.baseFee, session.currency) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg bg-muted/30 px-2.5 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-xs font-bold text-foreground truncate">{value}</p>
            </div>
          ))}
        </div>

        {totalCapacity > 0 && (
          <div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("sessions.card.capacityUsed", {
                percent: capacityPercent,
                count: classCount,
                classesLabel: classCount === 1 ? t("sessions.card.classSingular") : t("sessions.card.classPlural"),
              })}
            </p>
          </div>
        )}
      </Button>

      {canDelete && (
        <div className="absolute top-3 end-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
          {showDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("sessions.restore")}
              onClick={(event) => {
                event.stopPropagation();
                onRestore?.(session.id);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(session.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          )}
        </div>
      )}
    </MotionCard>
  );
}
