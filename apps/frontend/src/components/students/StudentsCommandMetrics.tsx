import React from "react";
import { GraduationCap, Filter, UserCheck, UserX, UserMinus, CalendarPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsMetrics } from "@/hooks/useStudents";
import { ModuleCommandMetricCard } from "@/components/ui/ModuleCommandMetricCard";

interface StudentsCommandMetricsProps {
  total: number;
  shown: number;
}

export default function StudentsCommandMetrics({
  total,
  shown,
}: StudentsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useStudentsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    active: serverMetrics?.active ?? 0,
    inactive: serverMetrics?.inactive ?? 0,
    suspended: serverMetrics?.suspended ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <ModuleCommandMetricCard icon={GraduationCap} label={t("students.metrics.total")} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t("students.metrics.filtered")} value={shown} />
      <ModuleCommandMetricCard icon={UserCheck} label={t("students.metrics.active")} value={metrics.active} />
      <ModuleCommandMetricCard icon={UserX} label={t("students.metrics.inactive")} value={metrics.inactive} />
      <ModuleCommandMetricCard icon={UserMinus} label={t("students.metrics.suspended")} value={metrics.suspended} />
      <ModuleCommandMetricCard icon={CalendarPlus} label={t("students.metrics.newThisPeriod")} value={metrics.newThisPeriod} />
    </div>
  );
}
