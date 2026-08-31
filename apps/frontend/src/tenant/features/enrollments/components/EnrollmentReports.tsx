import React, { lazy, Suspense } from "react";
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import { ReportDataGridContainer } from "@/tenant/components/moduleReports";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import type { EnrollmentsReportAggregates } from "@mms/shared";
import { EMPTY_ENROLLMENTS_REPORT_AGGREGATES } from "@mms/shared";
import { ReportFilterBanner } from "@/components/ui/reports/ReportFilterBanner";
import { Skeleton } from "@/components/ui/skeleton";

const EnrollmentReportsCharts = lazy(() =>
  import("./EnrollmentReportsCharts").then((mod) => ({ default: mod.EnrollmentReportsCharts })),
);

import PinnedWidgets from "@/components/ui/reports/PinnedWidgets";

export interface EnrollmentReportsProps {
  aggregates?: EnrollmentsReportAggregates;
  filters?: {
    session?: string;
    status?: string;
  };
}

/**
 * Displays EnrollmentReports KPIs and charts from server report-aggregates.
 */
export function EnrollmentReports({
  aggregates = EMPTY_ENROLLMENTS_REPORT_AGGREGATES,
  filters,
}: EnrollmentReportsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();

  const { bySession } = aggregates;

  const exportColumns = (() => [
    { key: "session", header: t("enrollments.columns.session") },
    { key: "count", header: t("enrollments.metrics.total") },
    { key: "revenue", header: t("enrollments.columns.finalFee") },
  ])() as ExportColumn[];

  const exportRows = (() => bySession.map((sessionStats) => ({
    session: sessionStats.name,
    count: sessionStats.count,
    revenue: formatCurrency(sessionStats.revenue),
  })))();

  return (
    <section className="space-y-6" aria-label={t("enrollments.reports.aria")}>
      <ReportFilterBanner
        label={t("reports.filters.title")}
        filters={[
          filters?.session && filters.session !== "all"
            ? {
                key: "session",
                value: filters.session,
              }
            : null,
          filters?.status && filters.status !== "all"
            ? {
                key: "status",
                value: filters.status,
              }
            : null,
        ]}
      />

      <Suspense fallback={<Skeleton className="h-chart-md w-full rounded-xl" />}>
        <EnrollmentReportsCharts aggregates={aggregates} />
      </Suspense>

      <ReportDataGridContainer
        title={t("enrollments.reports.revenueBySession")}
        columns={exportColumns}
        rows={exportRows}
        moduleId="enrollments"
      >
        <div className="hidden md:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-muted/30">
                <TableHead className="px-4 py-2.5 font-bold text-foreground">{t("enrollments.columns.session")}</TableHead>
                <TableHead className="px-4 py-2.5 font-bold text-foreground text-center">{t("enrollments.metrics.total")}</TableHead>
                <TableHead className="px-4 py-2.5 font-bold text-foreground text-end">{t("enrollments.columns.finalFee")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {bySession.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    {t("enrollments.reports.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                bySession.map((sessionStats) => (
                  <TableRow key={`${sessionStats.sessionId}:${sessionStats.name}`} className="transition-colors hover:bg-muted/20">
                    <TableCell className="px-4 py-3 font-semibold text-foreground">{sessionStats.name}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground font-mono">
                      {sessionStats.count}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end font-bold text-primary font-mono">
                      {formatCurrency(sessionStats.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y divide-border/50 md:hidden" role="list">
          {bySession.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("enrollments.reports.noData")}
            </div>
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
      </ReportDataGridContainer>

      <PinnedWidgets category="enrollments" />
    </section>
  );
}
