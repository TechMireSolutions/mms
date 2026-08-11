import type { ReactNode } from "react";
import { formatDate, formatMoney } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { Session } from "@/lib/data/sessionsData";
import { getSessionEnrollmentTotals } from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";

/** Enrollment totals + capacity meta for the Session card progress bar. */
export function getSessionCapacityMeta(session: Session) {
  const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(session);
  const capacityPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const classCount = session.classes?.length ?? 0;
  return { totalEnrolled, totalCapacity, capacityPercent, classCount };
}

/** Render a Sessions Work column value (non-face columns). */
export function renderSessionWorkColumnValue(
  session: Session,
  columnKey: string,
  options: {
    t: TranslationFunction;
    statusConfig: Record<string, StatusBadgeConfigItem>;
    typeConfig: Record<string, StatusBadgeConfigItem>;
    /** Replacement shown for empty values. */
    emptyFallback?: ReactNode;
  },
): ReactNode {
  const { t, statusConfig, typeConfig, emptyFallback } = options;
  const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(session);

  switch (columnKey) {
    case "type":
      return <StatusBadge status={session.type || "other"} config={typeConfig} size="sm" />;
    case "duration":
      return `${formatDate(session.startDate, true)} — ${formatDate(session.endDate, true)}`;
    case "fee":
      return formatMoney(session.baseFee, session.currency);
    case "enrolled":
      return `${totalEnrolled}/${totalCapacity || t("common.notSpecified")}`;
    case "status":
      return <StatusBadge status={session.status} config={statusConfig} size="sm" />;
    default:
      return emptyFallback;
  }
}
