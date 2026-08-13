import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ClipboardEdit } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ActionButton } from '@/components/ui/ActionButton';
import { AttendanceCommandMetrics } from '@/tenant/features/attendance/components/AttendanceCommandMetrics';
import { AttendanceReportsTier } from '@/tenant/features/attendance/components/AttendanceReportsTier';
import { AttendanceSetupTier } from '@/tenant/features/attendance/components/AttendanceSetupTier';
import { AttendanceWorkTier } from '@/tenant/features/attendance/components/AttendanceWorkTier';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAttendancePageController } from '@/tenant/features/attendance/hooks/useAttendancePageController';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

export default function Attendance() {
  const {
    t,
    can,
    role,
    filters,
    setFilters,
    showDeleted,
    setShowDeleted,
    setActiveTab,
    setActiveOpsTab,
    setActiveAnalyticsTab,
    attendanceCollectionQuery,
    attendancePageQuery,
    activeAttendanceRecords,
    attendanceRecords,
    columnLayout,
    messagingTarget,
    closeComposer,
    handleMessageAttendance,
    persistRecords,
    handleUpdateRecord,
    handleDeleteRecord,
    handleRestoreRecord,
    handleBulkDeleteRecords,
    handleBulkRestoreRecords,
    canWriteAttendance,
    canDeleteAttendance,
    visibleTopTabs,
    visibleOperationsTabs,
    visibleAnalyticsTabs,
    effectiveTab,
    effectiveOpsTab,
    effectiveAnalyticsTab,
    pageFilteredCount,
  } = useAttendancePageController();

  const renderContent = () => {
    if (!effectiveTab) return null;
    if (effectiveTab === 'setup') {
      return <AttendanceSetupTier />;
    }

    if (effectiveTab === 'reports') {
      return (
        <AttendanceReportsTier
          role={role}
          filters={filters}
          records={attendanceRecords}
          analyticsTabs={visibleAnalyticsTabs}
          activeAnalyticsTab={effectiveAnalyticsTab}
          onAnalyticsTabChange={setActiveAnalyticsTab}
        />
      );
    }

    return (
      <AttendanceWorkTier
        filters={filters}
        role={role}
        records={attendanceRecords}
        activeRecords={activeAttendanceRecords}
        activeOpsTab={effectiveOpsTab}
        operationsTabs={visibleOperationsTabs}
        showDeleted={showDeleted}
        canDeleteAttendance={canDeleteAttendance}
        showRoleBanner={!can('users.manage')}
        roleLabel={t('attendance.roleBanner.label', { role })}
        teacherRoleText={can('attendance.write') && !can('finance.write') && t('attendance.roleBanner.teacher')}
        accountantRoleText={can('finance.write') && !can('attendance.write') && t('attendance.roleBanner.accountant')}
        showActiveLabel={t('attendance.showActive')}
        showDeletedLabel={t('attendance.showDeleted')}
        onFiltersChange={setFilters}
        onOpsTabChange={setActiveOpsTab}
        onShowDeletedToggle={() => setShowDeleted((current) => !current)}
        onPersistRecords={persistRecords}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
        onRestoreRecord={handleRestoreRecord}
        onBulkDeleteRecords={handleBulkDeleteRecords}
        onBulkRestoreRecords={handleBulkRestoreRecords}
        onMessage={handleMessageAttendance}
        columnProps={{
          isColumnVisible: columnLayout.isColumnVisible,
          getColumnWidth: columnLayout.getColumnWidth,
          onColumnResize: columnLayout.setColumnWidth,
          columnCustomizer: {
            columnRegistry: columnLayout.columnRegistry,
            updateUserColumnLayout: columnLayout.updateUserColumnLayout,
            labels: columnLayout.customizerLabels,
          },
        }}
      />
    );
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.attendance')}`}
      seoDescription={t('page.attendance.subtitle')}
      headerIcon={UserCheck}
      headerTitle={t('nav.attendance')}
      headerSubtitle={t('page.attendance.subtitle')}
      headerActions={
        canWriteAttendance && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={ClipboardEdit}
            onClick={() => {
              setActiveTab('work');
              setActiveOpsTab('mark');
            }}
          >
            {t('attendance.tabs.mark')}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <AttendanceCommandMetrics
          total={attendanceRecords.length}
          shown={pageFilteredCount}
          selectedDate={filters.date}
        />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTopTabs}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        hideWhenSingle
        panelIdPrefix="attendance-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveTab + '-' + effectiveOpsTab + '-' + role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorBoundary>
              {(attendanceCollectionQuery.isError || (effectiveTab === 'work' && attendancePageQuery.isError)) ? (
                <ErrorState
                  title={t('attendance.toast.loadFailed')}
                  description={t('attendance.loadFailedHint')}
                  onRetry={() => {
                    void attendanceCollectionQuery.refetch();
                    void attendancePageQuery.refetch();
                  }}
                />
              ) : renderContent()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </ModulePageShell>
  );
}
