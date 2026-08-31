import React, { lazy, Suspense } from 'react';
import { TEACHERS_MODULE_MANIFEST, toTitleCase } from '@mms/shared';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ReportDataGridContainer } from './ReportDataGridContainer';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import PinnedWidgets from './PinnedWidgets';
import { ReportFilterBanner } from './ReportFilterBanner';
import { FacultyReportTables } from './FacultyReportTables';
import { useFacultyReportController } from './useFacultyReportController';
import type { TeacherReportProps } from './teacherReportTypes';

const FacultyReportChartSection = lazy(() =>
  import('./FacultyReportSections').then((mod) => ({ default: mod.FacultyReportChartSection })),
);

export type {
  FacultyWorkloadItem,
  ReportTeacher,
  TeacherReportFilters,
  TeacherReportProps,
} from './teacherReportTypes';

const FacultyReport = (function FacultyReport({ filters }: TeacherReportProps): React.JSX.Element {
  const report = useFacultyReportController({ filters });

  if (report.activeSubTab === 'roster' && report.listError) {
    return (
      <div className="p-4">
        <ErrorState
          title={report.t('teachers.report.loadFailed')}
          description={report.t('teachers.report.loadFailedHint')}
          onRetry={() => {
            void report.listRefetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReportFilterBanner
        label={report.t('teachers.report.filterLabel')}
        filters={[
          report.reportStatusFilter
            ? {
                key: 'status',
                value: toTitleCase(report.reportStatusFilter),
                onClear: () => report.setReportStatusFilter(null),
                clearLabel: report.t('teachers.report.clearFilter'),
              }
            : null,
          report.filters.student
            ? {
                key: 'faculty',
                value: `"${report.filters.student}"`,
              }
            : null,
        ]}
      />

      <SubTabBar
        tabs={report.REPORT_TABS}
        value={report.activeSubTab}
        onChange={report.setActiveSubTab}
        panelIdPrefix="faculty-report-subtab"
      />

      {report.activeSubTab === 'roster' ? (
        <ReportDataGridContainer
          title={report.t('teachers.report.rosterTab')}
          columns={report.rosterExportColumns}
          rows={report.teachers as unknown as Record<string, unknown>[]}
          resolveRows={report.resolveRosterExportRows}
          moduleId="teachers"
          page={report.listPage}
          total={report.listTotal}
          limit={TEACHERS_MODULE_MANIFEST.defaultPageSize}
          hasMore={report.listHasMore}
          onPageChange={report.setListPage}
          i18nNamespace="teachers"
          paginationVariant="range"
        >
          <FacultyReportTables
            activeSubTab={report.activeSubTab}
            teachers={report.teachers}
            statusBadgeConfig={report.statusBadgeConfig}
            listLoading={report.listLoading}
            workloadRows={report.filteredFacultyWorkload}
            selectedFaculty={report.selectedFaculty}
            onToggleFacultyFilter={report.toggleFacultyFilter}
          />
        </ReportDataGridContainer>
      ) : (
        <div className="space-y-3">
          <Suspense fallback={<Skeleton className="h-chart-md w-full rounded-xl" />}>
            <FacultyReportChartSection
              t={report.t}
              facultyWorkload={report.facultyWorkload}
              onBarClick={report.toggleFacultyFilter}
            />
          </Suspense>
          <ReportDataGridContainer
            title={report.t('teachers.report.workloadTab')}
            columns={report.workloadExportColumns}
            rows={report.filteredFacultyWorkload as unknown as Record<string, unknown>[]}
            moduleId="teachers"
          >
            <FacultyReportTables
              activeSubTab={report.activeSubTab}
              teachers={report.teachers}
              statusBadgeConfig={report.statusBadgeConfig}
              listLoading={report.listLoading}
              workloadRows={report.filteredFacultyWorkload}
              selectedFaculty={report.selectedFaculty}
              onToggleFacultyFilter={report.toggleFacultyFilter}
            />
          </ReportDataGridContainer>
        </div>
      )}

      <PinnedWidgets category="teachers" />
    </div>
  );
});

export default FacultyReport;
