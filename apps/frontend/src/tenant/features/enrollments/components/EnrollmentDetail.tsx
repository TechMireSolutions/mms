import React from "react";
import {
  User, BookOpen, Layers, DollarSign, Clock, ArrowRight,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { STATUS_MAP, Enrollment } from '@/lib/data/enrollmentData';
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { Button } from "@/components/ui/button";
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
      <span className="text-xs font-semibold text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

const paymentColors: Record<string, string> = {
  paid:    "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  overdue: "bg-destructive/15 text-destructive",
  partial: "bg-info/15 text-info",
};

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

  if (!enrollment) return null;
  const enrollmentStatus = STATUS_MAP[enrollment.status] || { label: enrollment.status, color: "bg-muted text-muted-foreground border-border" };

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
            <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/10 font-bold uppercase">
              {t("enrollments.detail.grNumber")}: {student.grNumber}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${enrollmentStatus.color}`}>
            {enrollmentStatus.label}
          </span>
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
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${paymentColors[enrollment.paymentStatus] || "bg-muted text-muted-foreground"}`}>
              {enrollment.paymentStatus || "—"}
            </span>
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
                    <p className="text-[11px] text-muted-foreground mt-0.5">
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
              const statusInfo = STATUS_MAP[nextStatus];
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
                  {statusInfo?.label || nextStatus}
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
