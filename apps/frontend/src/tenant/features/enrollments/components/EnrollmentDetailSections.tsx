import React from "react";
import {
  User, BookOpen, Layers, DollarSign, Clock, ArrowRight, CircleDollarSign,
} from "lucide-react";
import type { Student } from "@mms/shared";
import { type Enrollment } from "@/lib/data/enrollmentData";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ENROLLMENT_PAYMENT_STATUSES, formatDate, formatDateTime } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { Card } from "@/components/ui/card";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

export interface EnrollmentDetailSectionsProps {
  enrollment: Enrollment;
  student?: Student;
  formatCurrency: (value: number) => string;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  paymentConfig: Record<string, StatusBadgeConfigItem>;
  canWrite: boolean;
  isArchived: boolean;
  onStatusChange: (id: string, newStatus: Enrollment["status"]) => void;
  onPaymentStatusChange: (id: string, newStatus: Enrollment["paymentStatus"]) => void;
}

export function EnrollmentDetailSections({
  enrollment,
  student,
  formatCurrency,
  statusConfig,
  paymentConfig,
  canWrite,
  isArchived,
  onStatusChange,
  onPaymentStatusChange,
}: EnrollmentDetailSectionsProps): React.JSX.Element {
  const { t } = useTranslation();

  const nextStatuses = (
    enrollment.status === "pending"   ? ["confirmed", "cancelled"] :
    enrollment.status === "confirmed" ? ["completed", "cancelled"] :
    []
  ) as Enrollment["status"][];
  const nextPaymentStatuses = ENROLLMENT_PAYMENT_STATUSES.filter(
    (paymentStatus) => paymentStatus !== enrollment.paymentStatus,
  );

  return (
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

      {canWrite && !isArchived && (
        <div className="space-y-3 pt-1">
          {nextStatuses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-muted-foreground">{t("enrollments.detail.moveTo")}</p>
              {nextStatuses.map((nextStatus) => {
                const isCancel = nextStatus === "cancelled";
                return (
                  <Button
                    key={nextStatus}
                    variant="ghost"
                    onClick={() => onStatusChange(enrollment.id, nextStatus)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors h-auto cursor-pointer ${
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

          <div
            className="flex items-center gap-2 flex-wrap"
            role="group"
            aria-label={t("enrollments.detail.paymentStatus")}
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {t("enrollments.detail.paymentStatus")}:
            </p>
            {nextPaymentStatuses.map((nextPaymentStatus) => (
              <Button
                key={nextPaymentStatus}
                variant={nextPaymentStatus === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => onPaymentStatusChange(enrollment.id, nextPaymentStatus)}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <CircleDollarSign className="w-3.5 h-3.5" aria-hidden="true" />
                {paymentConfig[nextPaymentStatus]?.label || nextPaymentStatus}
              </Button>
            ))}
          </div>
        </div>
      )}
      {enrollment.notes && (
        <p className="text-xs text-muted-foreground px-1 mt-3" role="note">{enrollment.notes}</p>
      )}
    </div>
  );
}
