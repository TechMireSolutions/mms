import React from "react";
import { GraduationCap, Filter, UserCheck, UserX, UserMinus, CalendarPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsMetrics } from "@/tenant/features/students/hooks/useStudents";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";

interface StudentsCommandMetricsProps {
  total: number;
  shown: number;
}

export function StudentsCommandMetrics({
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

  const items = [
    { icon: GraduationCap, label: t("students.metrics.total"), value: metrics.total, accent: "primary" as const },
    { icon: Filter, label: t("students.metrics.filtered"), value: shown, accent: "info" as const },
    { icon: UserCheck, label: t("students.metrics.active"), value: metrics.active, accent: "success" as const },
    { icon: UserX, label: t("students.metrics.inactive"), value: metrics.inactive, accent: "warning" as const },
    { icon: UserMinus, label: t("students.metrics.suspended"), value: metrics.suspended, accent: "destructive" as const },
    { icon: CalendarPlus, label: t("students.metrics.newThisPeriod"), value: metrics.newThisPeriod, accent: "indigo" as const },
  ];

  return <ModuleCommandMetricsGrid items={items} />;
}
