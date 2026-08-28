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
import { EnrollmentArchivedBanner } from "@/tenant/features/enrollments/components/EnrollmentArchivedBanner";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { Card } from "@/components/ui/card";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

export interface EnrollmentDetailProps {
  enrollment: Enrollment | null | undefined;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Enrollment["status"]) => void;
  canWrite: boolean;
}

export const EnrollmentDetail = React.memo(function EnrollmentDetail({
  enrollment,
  onClose,
  onStatusChange,
  canWrite,
}: EnrollmentDetailProps): React.JSX.Element | null {
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

  const headerExtraNode = useMemo(() => {
    if (!enrollment) return null;
    return (
      <div className="flex flex-col gap-2 mt-1">
        {enrollment.deletedAt && (
          <EnrollmentArchivedBanner enrollment={enrollment} />
        )}
        <div className="flex items-center gap-2">
          <StatusBadge status={enrollment.status} config={statusConfig} />
          {enrollment.paymentStatus && (
            <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} />
          )}
        </div>
      </div>
    );
  }, [enrollment, statusConfig, paymentConfig]);

  if (!enrollment) return null;

  const nextStatuses = (
    enrollment.status === "pending"   ? ["confirmed", "cancelled"] :
    enrollment.status === "confirmed" ? ["completed", "cancelled"] :
    []
  ) as Enrollment["status"][];

  return (
    <DetailDrawerShell
      open={Boolean(enrollment)}
      onClose={onClose}
      title={student?.name || enrollment.studentName}
      subtitle={`${enrollment.sessionName} · #${enrollment.id}`}
      icon={User}
      ariaLabel={t("enrollments.detail.ariaLabel")}
      className="max-w-2xl"
      headerExtra={headerExtraNode}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <DetailSectionTitle>{t("enrollments.detail.sectionStudent")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" icon={User} label={t("enrollments.detail.name")} value={enrollment.studentName} />
            {student?.grNumber && <DetailAttributeRow variant="inset" icon={User} label={t("enrollments.detail.grNumber")} value={student.grNumber} />}
            <DetailAttributeRow variant="inset" icon={User} label={t("enrollments.detail.studentId")} value={enrollment.studentId} />
          </Card>
        </div>

        <div className="space-y-2">
          <DetailSectionTitle>{t("enrollments.detail.sectionSession")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" icon={BookOpen} label={t("enrollments.detail.session")} value={enrollment.sessionName} />
            <DetailAttributeRow variant="inset" icon={BookOpen} label={t("enrollments.detail.sessionId")} value={enrollment.sessionId} />
            <DetailAttributeRow variant="inset" icon={Clock} label={t("enrollments.detail.enrolledOn")} value={formatDate(enrollment.enrolledDate)} />
          </Card>
        </div>

        <div className="space-y-2">
          <DetailSectionTitle>{t("enrollments.detail.sectionClass")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" icon={Layers} label={t("enrollments.detail.class")} value={enrollment.className} />
            <DetailAttributeRow variant="inset" icon={Layers} label={t("enrollments.detail.classId")} value={enrollment.classId} />
          </Card>
        </div>

        <div className="space-y-2">
          <DetailSectionTitle>{t("enrollments.detail.sectionFee")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" icon={DollarSign} label={t("enrollments.detail.baseFee")} value={formatCurrency(enrollment.baseFee)} />
            <DetailAttributeRow
              variant="inset"
              icon={DollarSign}
              label={enrollment.discountLabel || t("enrollments.detail.discount")}
              value={enrollment.discountPct > 0
                ? `– ${formatCurrency(enrollment.discountAmt)} (${enrollment.discountPct}%)`
                : t("enrollments.detail.none")}
            />
            <div className="flex items-center justify-between p-3">
              <span className="text-xs font-bold text-foreground">{t("enrollments.detail.totalDue")}</span>
              <span className="text-sm font-bold text-primary">{formatCurrency(enrollment.finalFee)}</span>
            </div>
            <DetailAttributeRow variant="inset" icon={DollarSign} label={t("enrollments.detail.paymentStatus")} value={
              enrollment.paymentStatus
                ? <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} size="sm" />
                : "—"
            } />
          </Card>
        </div>

        {enrollment.timeline && enrollment.timeline.length > 0 && (
          <div className="space-y-2">
            <DetailSectionTitle>{t("enrollments.detail.sectionTimeline")}</DetailSectionTitle>
            <Card className="divide-y divide-border/50 p-0">
              <div className="p-3 space-y-3" role="list">
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
            </Card>
          </div>
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
});

