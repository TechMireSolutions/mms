import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { chartAxisTick } from "@/components/ui/ChartGrid";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { Users, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { ENROLLMENT_STATUSES } from '@/lib/data/enrollmentData';
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { CARD_STRIPE_INSET } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import type { EnrollmentsReportAggregates } from "@mms/shared";
import { EMPTY_ENROLLMENTS_REPORT_AGGREGATES } from "@mms/shared";

interface EnrollmentReportsProps {
  aggregates?: EnrollmentsReportAggregates;
}

/**
 * Displays EnrollmentReports KPIs and charts from server report-aggregates.
 */
export function EnrollmentReports({
  aggregates = EMPTY_ENROLLMENTS_REPORT_AGGREGATES,
}: EnrollmentReportsProps): React.ReactElement {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const palette = useBrandPalette();
  const COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[0], palette.charts[3]],
    [palette],
  );

  const { statusCounts, fees, bySession } = aggregates;
  const total = statusCounts.total;
  const confirmed = statusCounts.confirmed;
  const pending = statusCounts.pending;
  const cancelled = statusCounts.cancelled;

  const statusLabels = useMemo(() => ({
    pending: t("enrollments.status.pending"),
    confirmed: t("enrollments.status.confirmed"),
    cancelled: t("enrollments.status.cancelled"),
    completed: t("enrollments.status.completed"),
  }), [t]);

  const statusData = ENROLLMENT_STATUSES.map((status) => ({
    name: statusLabels[status.id as keyof typeof statusLabels] ?? status.id,
    value:
      status.id === "pending" ? statusCounts.pending
        : status.id === "confirmed" ? statusCounts.confirmed
          : status.id === "cancelled" ? statusCounts.cancelled
            : status.id === "completed" ? statusCounts.completed
              : 0,
  }));

  return (
    <section className="space-y-6" aria-label={t("enrollments.reports.aria")}>
      <ModuleCommandMetricsGrid
        items={[
          {
            icon: Users,
            label: t("enrollments.metrics.total"),
            value: total,
            sub: t("enrollments.reports.confirmedSub", { count: confirmed }),
            accent: "primary",
          },
          {
            icon: TrendingUp,
            label: t("enrollments.metrics.confirmed"),
            value: confirmed,
            sub: t("enrollments.reports.pendingSub", { count: pending }),
            accent: "success",
          },
          {
            icon: BookOpen,
            label: t("enrollments.metrics.cancelled"),
            value: cancelled,
            sub: t("enrollments.reports.cancelledSub", { count: cancelled, total }),
            accent: "destructive",
          },
          {
            icon: DollarSign,
            label: t("enrollments.reports.revenueDue"),
            value: formatCurrency(fees.due),
            sub: t("enrollments.reports.paidSub", { amount: formatCurrency(fees.paid) }),
            accent: "warning",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accentColor="primary" className={cn("p-4", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-3">{t("enrollments.reports.byStatus")}</h3>
          <div className="h-chart-md" aria-hidden="true">
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

        <Card accentColor="info" className={cn("p-4", CARD_STRIPE_INSET)}>
          <h3 className="text-sm font-bold text-foreground mb-3">{t("enrollments.reports.bySession")}</h3>
          {bySession.length === 0 ? (
            <EmptyState title={t("enrollments.reports.noData")} compact icon={null} className="h-chart-md" />
          ) : (
            <div className="h-chart-md" aria-hidden="true">
              <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={bySession} barSize={20}>
                  <XAxis dataKey="name" tick={chartAxisTick(10)} tickLine={false} />
                  <YAxis tick={chartAxisTick(10)} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value}`]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card accentColor="success" className="p-0 overflow-hidden">
        <div className={cn("px-4 py-2.5 bg-muted/20 border-b border-border/40", CARD_STRIPE_INSET)}>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{t("enrollments.reports.revenueBySession")}</h3>
        </div>
        <div className={cn("divide-y divide-border/50", CARD_STRIPE_INSET)} role="list">
          {bySession.length === 0 ? (
            <EmptyState title={t("enrollments.reports.noData")} compact icon={null} />
          ) : (
            bySession.map((sessionStats) => (
              <div
                key={`${sessionStats.sessionId}:${sessionStats.name}`}
                className="flex min-w-0 items-center justify-between gap-3 px-4 py-3"
                role="listitem"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{sessionStats.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("enrollments.reports.enrollmentCount", { count: sessionStats.count })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">{formatCurrency(sessionStats.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
