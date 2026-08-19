import React from 'react';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { StatsSkeleton } from '@/components/ui/LoadingState';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import { ListPagination } from '@/components/ui/ListPagination';
import { ErrorState } from '@/components/ui/ErrorState';
import { FacultyReportChartSection } from './FacultyReportSections';
import { FacultyReportDashboardWidgets } from './FacultyReportDashboardWidgets';
import { FacultyReportFilterBanner } from './FacultyReportFilterBanner';
import { FacultyReportTables } from './FacultyReportTables';
import { useFacultyReportController } from './useFacultyReportController';
import type { TeacherReportProps } from './teacherReportTypes';

export type {
  FacultyWorkloadItem,
  ReportTeacher,
  TeacherReportFilters,
  TeacherReportProps,
} from './teacherReportTypes';

const FacultyReport = React.memo(function FacultyReport({ filters }: TeacherReportProps): React.JSX.Element {
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
      {report.metricsLoading && !report.metrics ? (
        <StatsSkeleton count={4} />
      ) : (
        <ModuleCommandMetricsGrid items={report.metricItems} />
      )}

      <FacultyReportFilterBanner
        hasBaseStatusFilter={Boolean(report.filters.status && report.filters.status !== 'all')}
        reportStatusFilter={report.reportStatusFilter}
        studentFilter={report.filters.student}
        onClearStatusFilter={() => report.setReportStatusFilter(null)}
      />

      <SubTabBar
        tabs={report.REPORT_TABS}
        value={report.activeSubTab}
        onChange={report.setActiveSubTab}
        panelIdPrefix="faculty-report-subtab"
      />

      <ExportToolbar
        title={report.activeSubTab === 'roster' ? report.t('teachers.report.rosterTab') : report.t('teachers.report.workloadTab')}
        columns={report.activeSubTab === 'roster' ? report.rosterExportColumns : undefined}
        rows={
          report.activeSubTab === 'roster'
            ? (report.teachers as unknown as Record<string, unknown>[])
            : undefined
        }
        data={report.activeSubTab === 'roster' ? undefined : report.filteredFacultyWorkload}
        headers={
          report.activeSubTab === 'roster'
            ? undefined
            : [
                report.t('teachers.report.colFaculty'),
                report.t('teachers.report.colClasses'),
                report.t('teachers.report.colSessions'),
                report.t('teachers.report.colStudents'),
              ]
        }
        resolveRows={report.activeSubTab === 'roster' ? report.resolveRosterExportRows : undefined}
        moduleId="teachers"
      />

      {report.activeSubTab === 'roster' ? (
        <div className="space-y-3">
          <FacultyReportTables
            activeSubTab={report.activeSubTab}
            teachers={report.teachers}
            statusBadgeConfig={report.statusBadgeConfig}
            listLoading={report.listLoading}
            workloadRows={report.filteredFacultyWorkload}
            selectedFaculty={report.selectedFaculty}
            onToggleFacultyFilter={report.toggleFacultyFilter}
          />
          <ListPagination
            page={report.listPage}
            total={report.listTotal}
            limit={TEACHERS_MODULE_MANIFEST.defaultPageSize}
            hasMore={report.listHasMore}
            onPageChange={report.setListPage}
            i18nNamespace="teachers"
            variant="range"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <FacultyReportChartSection
            t={report.t}
            facultyWorkload={report.facultyWorkload}
            onBarClick={report.toggleFacultyFilter}
          />
          <FacultyReportTables
            activeSubTab={report.activeSubTab}
            teachers={report.teachers}
            statusBadgeConfig={report.statusBadgeConfig}
            listLoading={report.listLoading}
            workloadRows={report.filteredFacultyWorkload}
            selectedFaculty={report.selectedFaculty}
            onToggleFacultyFilter={report.toggleFacultyFilter}
          />
        </div>
      )}

      <FacultyReportDashboardWidgets />
    </div>
  );
});

export default FacultyReport;

