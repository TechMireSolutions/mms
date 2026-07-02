import React from "react";
import { School, Filter, UserCheck, UserX, CalendarClock, CalendarPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeachersMetrics } from "@/tenant/features/teachers/hooks/useTeachers";
import { ModuleCommandMetricCard } from "@/components/ui/ModuleCommandMetricCard";

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <ModuleCommandMetricCard icon={School} label={t("teachers.metrics.total")} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t("teachers.metrics.filtered")} value={shown} />
      <ModuleCommandMetricCard icon={UserCheck} label={t("teachers.metrics.active")} value={metrics.active} />
      <ModuleCommandMetricCard icon={UserX} label={t("teachers.metrics.inactive")} value={metrics.inactive} />
      <ModuleCommandMetricCard icon={CalendarClock} label={t("teachers.metrics.onLeave")} value={metrics.onLeave} />
      <ModuleCommandMetricCard icon={CalendarPlus} label={t("teachers.metrics.newThisPeriod")} value={metrics.newThisPeriod} />
    </div>
  );
}
