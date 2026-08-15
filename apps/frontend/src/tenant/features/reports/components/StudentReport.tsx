import React from 'react';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
} from '@mms/shared';
import { Loader2 } from 'lucide-react';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import { ListPagination } from '@/components/ui/ListPagination';
import { ErrorState } from '@/components/ui/ErrorState';
import { StudentReportDashboardWidgets } from './StudentReportDashboardWidgets';
import { StudentReportFilterBanner } from './StudentReportFilterBanner';
import { StudentReportTables } from './StudentReportTables';
import { useStudentReportController } from './useStudentReportController';
import type { StudentReportProps } from './studentReportTypes';

export type { EnrollmentHistoryItem, ReportStudent, StudentReportFilters, StudentReportProps } from './studentReportTypes';

const StudentReport = React.memo(function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const report = useStudentReportController({ filters });

  if ((report.activeSubTab === 'list' && report.listError) || (report.activeSubTab === 'history' && report.historyError)) {
    return (
      <div className="p-4">
        <ErrorState
          title={report.t('students.report.loadFailed')}
          description={report.t('students.report.loadFailedHint')}
          onRetry={() => {
            if (report.activeSubTab === 'list') void report.listRefetch();
            else void report.enrollmentsPageQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {report.metricsLoading && !report.metrics ? (
        <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground" role="status">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">{report.t("common.loading")}</span>
        </div>
      ) : (
        <ModuleCommandMetricsGrid items={report.metricItems} />
      )}

      <StudentReportFilterBanner
        hasBaseStatusFilter={Boolean(report.filters.status && report.filters.status !== 'all')}
        reportStatusFilter={report.reportStatusFilter}
        studentFilter={report.filters.student}
        onClearStatusFilter={() => report.setReportStatusFilter(null)}
      />

      <SubTabBar
        tabs={report.REPORT_TABS}
        value={report.activeSubTab}
        onChange={report.setActiveSubTab}
        panelIdPrefix="student-report-subtab"
      />

      <ExportToolbar
        title={report.activeSubTab === 'list' ? report.t('students.report.studentListTab') : report.t('students.report.enrollmentHistoryTab')}
        columns={report.activeSubTab === 'list' ? report.studentExportColumns : report.enrollmentExportColumns}
        rows={report.activeSubTab === 'list' ? (report.students as unknown as Record<string, unknown>[]) : (report.enrollments as unknown as Record<string, unknown>[])}
        resolveRows={report.activeSubTab === 'list' ? report.resolveStudentExportRows : report.resolveEnrollmentExportRows}
        moduleId="students"
      />

      <div className="space-y-3">
        <StudentReportTables
          activeSubTab={report.activeSubTab}
          students={report.students}
          enrollments={report.enrollments}
          statusBadgeConfig={report.statusBadgeConfig}
          enrollmentStatusConfig={report.enrollmentStatusConfig}
          listLoading={report.listLoading}
          historyLoading={report.historyLoading}
        />
        {report.activeSubTab === 'list' && (
          <ListPagination
            page={report.listPage}
            total={report.listTotal}
            limit={STUDENTS_MODULE_MANIFEST.defaultPageSize}
            hasMore={report.listHasMore}
            onPageChange={report.setListPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
        {report.activeSubTab === 'history' && report.enrollmentsPageQuery.data && (
          <ListPagination
            page={report.historyPage}
            total={report.enrollmentsPageQuery.data.total}
            limit={ENROLLMENTS_MODULE_MANIFEST.defaultPageSize}
            hasMore={report.enrollmentsPageQuery.data.hasMore}
            onPageChange={report.setHistoryPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
      </div>

      <StudentReportDashboardWidgets />
    </div>
  );
});

export default StudentReport;

