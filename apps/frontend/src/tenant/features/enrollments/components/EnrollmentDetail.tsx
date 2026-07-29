import React, { useMemo } from "react";
import {
  User, BookOpen, Layers, DollarSign, Clock, ArrowRight,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Enrollment } from '@/lib/data/enrollmentData';
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { formatDate, formatDateTime } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";

interface SectionProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label={title}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </section>
  );
}

interface RowProps {
  label: string;
  value: React.ReactNode;
}

function Row({ label, value }: RowProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-end">{value || "—"}</span>
    </div>
  );
}

interface EnrollmentDetailProps {
  enrollment: Enrollment | null | undefined;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Enrollment["status"]) => void;
  canWrite: boolean;
}

export function EnrollmentDetail({ enrollment, onClose, onStatusChange, canWrite }: EnrollmentDetailProps): React.ReactElement | null {
  const { t } = useTranslation();
  const { data: resolvedStudents = [] } = useStudentsByIds(enrollment ? [enrollment.studentId] : []);
  const { formatCurrency } = useFinanceCurrency();
  const student = resolvedStudents[0];

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    pending: { label: t("enrollments.status.pending"), cls: SEMANTIC_BADGE.warning },
    confirmed: { label: t("enrollments.status.confirmed"), cls: SEMANTIC_BADGE.success },
    cancelled: { label: t("enrollments.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
    completed: { label: t("enrollments.status.completed"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const paymentConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("enrollments.payment.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("enrollments.payment.pending"), cls: SEMANTIC_BADGE.warning },
    none: { label: t("enrollments.payment.none"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  if (!enrollment) return null;

  const TRANSITIONS: Record<Enrollment["status"], Enrollment["status"][]> = {
    pending:   ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    cancelled: [],
    completed: [],
  };
  const nextStatuses = TRANSITIONS[enrollment.status] || [];

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={enrollment.studentName}
      subtitle={`${enrollment.sessionName} · #${enrollment.id}`}
      icon={User}
      ariaLabel={t("enrollments.detail.ariaLabel")}
      className="max-w-2xl"
      headerExtra={
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {student?.grNumber && (
            <span className="bg-primary/5 text-primary text-xs px-2 py-0.5 rounded border border-primary/10 font-bold uppercase">
              {t("enrollments.detail.grNumber")}: {student.grNumber}
            </span>
          )}
          <StatusBadge status={enrollment.status} config={statusConfig} size="sm" />
        </div>
      }
    >
      <div className="space-y-4">
        <Section icon={User} title={t("enrollments.detail.sectionStudent")}>
          <Row label={t("enrollments.detail.name")} value={enrollment.studentName} />
          {student?.grNumber && <Row label={t("enrollments.detail.grNumber")} value={student.grNumber} />}
          <Row label={t("enrollments.detail.studentId")} value={enrollment.studentId} />
        </Section>

        <Section icon={BookOpen} title={t("enrollments.detail.sectionSession")}>
          <Row label={t("enrollments.detail.session")} value={enrollment.sessionName} />
          <Row label={t("enrollments.detail.sessionId")} value={enrollment.sessionId} />
          <Row label={t("enrollments.detail.enrolledOn")} value={formatDate(enrollment.enrolledDate)} />
        </Section>

        <Section icon={Layers} title={t("enrollments.detail.sectionClass")}>
          <Row label={t("enrollments.detail.class")} value={enrollment.className} />
          <Row label={t("enrollments.detail.classId")} value={enrollment.classId} />
        </Section>

        <Section icon={DollarSign} title={t("enrollments.detail.sectionFee")}>
          <Row label={t("enrollments.detail.baseFee")} value={formatCurrency(enrollment.baseFee)} />
          <Row
            label={enrollment.discountLabel || t("enrollments.detail.discount")}
            value={enrollment.discountPct > 0
              ? `– ${formatCurrency(enrollment.discountAmt)} (${enrollment.discountPct}%)`
              : t("enrollments.detail.none")}
          />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs font-bold text-foreground">{t("enrollments.detail.totalDue")}</span>
            <span className="text-sm font-bold text-primary">{formatCurrency(enrollment.finalFee)}</span>
          </div>
          <Row label={t("enrollments.detail.paymentStatus")} value={
            enrollment.paymentStatus
              ? <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} size="sm" />
              : "—"
          } />
        </Section>

        {enrollment.timeline && enrollment.timeline.length > 0 && (
          <Section icon={Clock} title={t("enrollments.detail.sectionTimeline")}>
            <div className="py-2 space-y-3" role="list">
              {enrollment.timeline.map((timelineItem, index) => (
                <div key={`${timelineItem.ts}-${timelineItem.event}`} className="flex gap-3" role="listitem">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" aria-hidden="true" />
                    {enrollment.timeline && index < enrollment.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" aria-hidden="true" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold text-foreground">{timelineItem.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(timelineItem.ts)} · {timelineItem.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {canWrite && nextStatuses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <p className="text-xs font-semibold text-muted-foreground">{t("enrollments.detail.moveTo")}</p>
            {nextStatuses.map((nextStatus) => {
              const isCancel = nextStatus === "cancelled";
              return (
                <Button
                  key={nextStatus}
                  variant="ghost"
                  onClick={() => onStatusChange(enrollment.id, nextStatus)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors h-auto ${
                    isCancel
                      ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15 hover:text-destructive"
                      : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary"
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  {statusConfig[nextStatus]?.label || nextStatus}
                </Button>
              );
            })}
          </div>
        )}
        {enrollment.notes && (
          <p className="text-xs text-muted-foreground px-1 mt-3" role="note">{enrollment.notes}</p>
        )}
      </div>
    </DetailDrawerShell>
  );
}
