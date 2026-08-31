import React from 'react';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  toTitleCase,
} from '@mms/shared';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ReportDataGridContainer } from './ReportDataGridContainer';
import { ErrorState } from '@/components/ui/ErrorState';
import PinnedWidgets from './PinnedWidgets';
import { ReportFilterBanner } from './ReportFilterBanner';
import { StudentReportTables } from './StudentReportTables';
import { useStudentReportController } from './useStudentReportController';
import type { StudentReportProps } from './studentReportTypes';

export type { EnrollmentHistoryItem, ReportStudent, StudentReportFilters, StudentReportProps } from './studentReportTypes';

const StudentReport = (function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
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
      <ReportFilterBanner
        label={report.t('students.report.filterLabel')}
        filters={[
          report.reportStatusFilter
            ? {
                key: 'status',
                value: toTitleCase(report.reportStatusFilter),
                onClear: () => report.setReportStatusFilter(null),
                clearLabel: report.t('students.report.clearFilter'),
              }
            : null,
          report.filters.student
            ? {
                key: 'student',
                value: `"${report.filters.student}"`,
              }
            : null,
        ]}
      />

      <SubTabBar
        tabs={report.REPORT_TABS}
        value={report.activeSubTab}
        onChange={report.setActiveSubTab}
        panelIdPrefix="student-report-subtab"
      />

      <ReportDataGridContainer
        title={report.activeSubTab === 'list' ? report.t('students.report.studentListTab') : report.t('students.report.enrollmentHistoryTab')}
        columns={report.activeSubTab === 'list' ? report.studentExportColumns : report.enrollmentExportColumns}
        rows={report.activeSubTab === 'list' ? (report.students as unknown as Record<string, unknown>[]) : (report.enrollments as unknown as Record<string, unknown>[])}
        resolveRows={report.activeSubTab === 'list' ? report.resolveStudentExportRows : report.resolveEnrollmentExportRows}
        moduleId="students"
        page={report.activeSubTab === 'list' ? report.listPage : report.historyPage}
        total={report.activeSubTab === 'list' ? report.listTotal : (report.enrollmentsPageQuery.data?.total ?? 0)}
        limit={report.activeSubTab === 'list' ? STUDENTS_MODULE_MANIFEST.defaultPageSize : ENROLLMENTS_MODULE_MANIFEST.defaultPageSize}
        hasMore={report.activeSubTab === 'list' ? report.listHasMore : (report.enrollmentsPageQuery.data?.hasMore ?? false)}
        onPageChange={report.activeSubTab === 'list' ? report.setListPage : report.setHistoryPage}
        i18nNamespace="students"
        paginationVariant="range"
      >
        <StudentReportTables
          activeSubTab={report.activeSubTab}
          students={report.students}
          enrollments={report.enrollments}
          statusBadgeConfig={report.statusBadgeConfig}
          enrollmentStatusConfig={report.enrollmentStatusConfig}
          listLoading={report.listLoading}
          historyLoading={report.historyLoading}
        />
      </ReportDataGridContainer>

      <PinnedWidgets category="students" />
    </div>
  );
});

export default StudentReport;
