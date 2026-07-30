import { useState, useMemo } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { todayISO, ATTENDANCE_MODULE_MANIFEST } from '@mms/shared';
import {
  useAttendanceRecords,
  useAttendancePaginated,
} from '@/tenant/features/attendance/hooks/useAttendance';
import { useAttendancePageActions } from '@/tenant/features/attendance/hooks/useAttendancePageActions';
import { useAttendanceColumnLayout } from '@/tenant/features/attendance/hooks/useAttendanceColumnLayout';
import { useAttendancePageTabs } from '@/tenant/features/attendance/hooks/useAttendancePageTabs';
import { useViewerRole } from '@/tenant/hooks/useViewerRole';
import { usePermissions, useModulePermissions } from '@/tenant/hooks/usePermissions';

const DEFAULT_FILTERS = {
  sessionId: '',
  classId: '',
  teacherId: '',
  date: todayISO(),
};

export function useAttendancePageController() {
  const { t } = useTranslation();
  const { canViewSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { can } = usePermissions();
  const role = useViewerRole();
  const [activeTab, setActiveTab] = usePersistedTabState<string>('attendance_active_tab', 'work');
  const [activeOpsTab, setActiveOpsTab] = useState('mark');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('charts');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showDeleted, setShowDeleted] = useState(false);
  const attendanceCollectionQuery = useAttendanceRecords();
  const attendancePageQuery = useAttendancePaginated({
    page: 1,
    limit: ATTENDANCE_MODULE_MANIFEST.maxPageSize,
    includeDeleted: showDeleted,
    enabled: activeTab === 'work',
  });
  const activeAttendanceRecords = attendanceCollectionQuery.syncedData;
  const workAttendanceRecords = attendancePageQuery.data?.records ?? [];
  const attendanceRecords = activeTab === 'work' ? workAttendanceRecords : activeAttendanceRecords;
  const columnLayout = useAttendanceColumnLayout();
  const {
    messagingTarget,
    closeComposer,
    handleMessageAttendance,
    persistRecords,
    handleUpdateRecord,
    handleDeleteRecord,
    handleRestoreRecord,
  } = useAttendancePageActions();

  const {
    canWriteAttendance,
    canDeleteAttendance,
    canAnalyticsView,
    visibleTopTabs,
    visibleOperationsTabs,
    visibleAnalyticsTabs,
    effectiveTab,
    effectiveOpsTab,
    effectiveAnalyticsTab,
  } = useAttendancePageTabs(activeTab, activeOpsTab, activeAnalyticsTab, canViewSetup);

  const pageFilteredCount = useMemo(() => {
    return attendanceRecords.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (filters.date && attendanceRecord.date !== filters.date) return false;
      return true;
    }).length;
  }, [attendanceRecords, filters.classId, filters.date]);

  useModuleCreateHotkey({
    enabled: canWriteAttendance && !showDeleted,
    onCreate: () => {
      setActiveTab('work');
      setActiveOpsTab('mark');
    },
  });

  return {
    t,
    can,
    role,
    filters,
    setFilters,
    showDeleted,
    setShowDeleted,
    activeTab,
    setActiveTab,
    activeOpsTab,
    setActiveOpsTab,
    activeAnalyticsTab,
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
    canWriteAttendance,
    canDeleteAttendance,
    canAnalyticsView,
    visibleTopTabs,
    visibleOperationsTabs,
    visibleAnalyticsTabs,
    effectiveTab,
    effectiveOpsTab,
    effectiveAnalyticsTab,
    pageFilteredCount,
  };
}
