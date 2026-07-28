import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { Users, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { ENROLLMENT_STATUSES, Enrollment } from '@/lib/data/enrollmentData';
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { StatCard } from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";

interface EnrollmentReportsProps {
  enrollments: Enrollment[];
}

interface SessionDataPoint {
  name: string;
  count: number;
  revenue: number;
}

/**
 * Aggregates and displays reports & charts representing enrollment distributions.
 */
export function EnrollmentReports({ enrollments }: EnrollmentReportsProps): React.ReactElement {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const palette = useBrandPalette();
  const COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[0], palette.charts[3]],
    [palette],
  );
  const total = enrollments.length;
  const confirmed = enrollments.filter((enrollment) => enrollment.status === "confirmed").length;
  const pending = enrollments.filter((enrollment) => enrollment.status === "pending").length;
  const cancelled = enrollments.filter((enrollment) => enrollment.status === "cancelled").length;
  const totalFees = enrollments.filter((enrollment) => enrollment.status !== "cancelled")
    .reduce((totalFee, enrollment) => totalFee + (enrollment.finalFee || 0), 0);
  const paidFees = enrollments.filter((enrollment) => enrollment.paymentStatus === "paid")
    .reduce((paidTotal, enrollment) => paidTotal + (enrollment.finalFee || 0), 0);

  const statusLabels = useMemo(() => ({
    pending: t("enrollments.status.pending"),
    confirmed: t("enrollments.status.confirmed"),
    cancelled: t("enrollments.status.cancelled"),
    completed: t("enrollments.status.completed"),
  }), [t]);

  const statusData = ENROLLMENT_STATUSES.map((status) => ({
    name: statusLabels[status.id as keyof typeof statusLabels] ?? status.id,
    value: enrollments.filter((enrollment) => enrollment.status === status.id).length,
  }));

  const sessionData = useMemo<SessionDataPoint[]>(() => {
    const sessionStatsById: Record<string, SessionDataPoint> = {};
    enrollments.forEach((enrollment) => {
      if (!sessionStatsById[enrollment.sessionId]) {
        sessionStatsById[enrollment.sessionId] = { name: enrollment.sessionName, count: 0, revenue: 0 };
      }
      sessionStatsById[enrollment.sessionId].count++;
      if (enrollment.status !== "cancelled") {
        sessionStatsById[enrollment.sessionId].revenue += enrollment.finalFee || 0;
      }
    });
    return Object.values(sessionStatsById);
  }, [enrollments]);

  return (
    <section className="space-y-6" aria-label={t("enrollments.reports.aria")}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label={t("enrollments.metrics.total")}
          value={total}
          sub={t("enrollments.reports.confirmedSub", { count: confirmed })}
          accent="primary"
        />
        <StatCard
          icon={TrendingUp}
          label={t("enrollments.metrics.confirmed")}
          value={confirmed}
          sub={t("enrollments.reports.pendingSub", { count: pending })}
          accent="success"
        />
        <StatCard
          icon={BookOpen}
          label={t("enrollments.metrics.cancelled")}
          value={cancelled}
          sub={t("enrollments.reports.cancelledSub", { count: cancelled, total })}
          accent="destructive"
        />
        <StatCard
          icon={DollarSign}
          label={t("enrollments.reports.revenueDue")}
          value={formatCurrency(totalFees)}
          sub={t("enrollments.reports.paidSub", { amount: formatCurrency(paidFees) })}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">{t("enrollments.reports.byStatus")}</h3>
          <div className="h-[200px]" aria-hidden="true">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {statusData.map((status, index) => <Cell key={status.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, t("enrollments.metrics.total")]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
        </Card>

        <Card accentColor="info" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">{t("enrollments.reports.bySession")}</h3>
          {sessionData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm" role="status">
              {t("enrollments.reports.noData")}
            </div>
          ) : (
            <div className="h-[200px]" aria-hidden="true">
              <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={sessionData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value}`]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card accentColor="success" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/40 ps-6.5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{t("enrollments.reports.revenueBySession")}</h3>
        </div>
        <div className="divide-y divide-border/50 ps-6.5" role="list">
          {sessionData.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground" role="status">{t("enrollments.reports.noData")}</p>
          ) : (
            sessionData.map((sessionStats) => (
              <div key={sessionStats.name} className="flex items-center justify-between px-4 py-3" role="listitem">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sessionStats.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("enrollments.reports.enrollmentCount", { count: sessionStats.count })}
                  </p>
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(sessionStats.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
