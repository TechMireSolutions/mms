import React from "react";
import { School, Filter, UserCheck, UserX, CalendarClock, CalendarPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeachersMetrics } from "@/tenant/features/teachers/hooks/useTeachers";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";

interface TeachersCommandMetricsProps {
  total: number;
  shown: number;
}

export function TeachersCommandMetrics({
  total,
  shown,
}: TeachersCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useTeachersMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    active: serverMetrics?.active ?? 0,
    inactive: serverMetrics?.inactive ?? 0,
    onLeave: serverMetrics?.onLeave ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  };

  const items = [
    { icon: School, label: t("teachers.metrics.total"), value: metrics.total, accent: "primary" as const },
    { icon: Filter, label: t("teachers.metrics.filtered"), value: shown, accent: "info" as const },
    { icon: UserCheck, label: t("teachers.metrics.active"), value: metrics.active, accent: "success" as const },
    { icon: UserX, label: t("teachers.metrics.inactive"), value: metrics.inactive, accent: "warning" as const },
    { icon: CalendarClock, label: t("teachers.metrics.onLeave"), value: metrics.onLeave, accent: "rose" as const },
    { icon: CalendarPlus, label: t("teachers.metrics.newThisPeriod"), value: metrics.newThisPeriod, accent: "indigo" as const },
  ];

  return <ModuleCommandMetricsGrid items={items} />;
}
