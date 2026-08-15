import React, { useMemo } from "react";
import { School, Filter, UserCheck, UserX, CalendarClock, CalendarPlus, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeachersMetrics } from "@/tenant/features/teachers/hooks/useTeachers";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { resolveTeacherStatusRoles } from "@mms/shared";
import { teacherStatusMetricAccent } from "@/lib/teachers/teacherStatusUi";

interface TeachersCommandMetricsProps {
  total: number;
  shown: number;
}

export const TeachersCommandMetrics = React.memo(function TeachersCommandMetrics({
  total,
  shown,
}: TeachersCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useTeachersMetrics();
  const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } = useMemo(
    () => resolveTeacherStatusRoles(),
    [],
  );

  const metrics = useMemo(() => ({
    total: serverMetrics?.total ?? total,
    active: serverMetrics?.active ?? 0,
    inactive: serverMetrics?.inactive ?? 0,
    onLeave: serverMetrics?.onLeave ?? 0,
    other: serverMetrics?.other ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  }), [serverMetrics, total]);

  const items = useMemo(() => [
    { icon: School, label: t("teachers.metrics.total"), value: metrics.total, accent: "primary" as const },
    { icon: Filter, label: t("teachers.metrics.filtered"), value: shown, accent: "info" as const },
    { icon: UserCheck, label: t("teachers.metrics.active"), value: metrics.active, accent: teacherStatusMetricAccent(activeStatus) },
    { icon: UserX, label: t("teachers.metrics.inactive"), value: metrics.inactive, accent: teacherStatusMetricAccent(inactiveStatus) },
    { icon: CalendarClock, label: t("teachers.metrics.onLeave"), value: metrics.onLeave, accent: teacherStatusMetricAccent(onLeaveStatus) },
    ...(metrics.other > 0
      ? [{ icon: Users, label: t("teachers.metrics.other"), value: metrics.other, accent: "muted" as const }]
      : []),
    { icon: CalendarPlus, label: t("teachers.metrics.newThisPeriod"), value: metrics.newThisPeriod, accent: "info" as const },
  ], [t, shown, metrics, activeStatus, inactiveStatus, onLeaveStatus]);

  return <ModuleCommandMetricsGrid items={items} />;
});
