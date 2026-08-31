import React from "react";
import { School, Filter, UserCheck, UserX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeachersMetrics } from "@/tenant/features/teachers/hooks/useTeachers";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { resolveTeacherStatusRoles } from "@mms/shared";
import { teacherStatusMetricAccent } from "@/lib/teachers/teacherStatusUi";

export interface TeachersCommandMetricsProps {
  total: number;
  shown: number;
}

export const TeachersCommandMetrics = (function TeachersCommandMetrics({
  total,
  shown,
}: TeachersCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useTeachersMetrics();
  const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } = (() => resolveTeacherStatusRoles())();

  const metrics = (() => ({
    total: serverMetrics?.total ?? total,
    active: serverMetrics?.active ?? 0,
    inactive: serverMetrics?.inactive ?? 0,
    onLeave: serverMetrics?.onLeave ?? 0,
    other: serverMetrics?.other ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  }))();

  const items = (() => [
    { icon: School, label: t("teachers.metrics.total"), value: metrics.total, accent: "primary" as const },
    { icon: Filter, label: t("teachers.metrics.filtered"), value: shown, accent: "info" as const },
    { icon: UserCheck, label: t("teachers.metrics.active"), value: metrics.active, accent: teacherStatusMetricAccent(activeStatus) },
    { icon: UserX, label: t("teachers.metrics.inactive"), value: metrics.inactive, accent: teacherStatusMetricAccent(inactiveStatus) },
  ])();

  return <ModuleCommandMetricsGrid items={items} />;
});
