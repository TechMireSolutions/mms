import { useState, useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { ClipboardList, UserCheck } from "lucide-react";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { Enrollment } from "@/lib/data/enrollmentData";
import {
  useEnrollmentMutations,
  useEnrollmentsPaginated,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { useEnrollmentsDirectoryFilters } from "@/tenant/features/enrollments/hooks/useEnrollmentsDirectoryFilters";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { useEnrollmentsPageActions } from "@/tenant/features/enrollments/hooks/useEnrollmentsPageActions";
import {
  defaultEnrollmentsExportColumns,
  useEnrollmentsExportActions,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsExportActions";
import { useEnrollmentColumnLayout } from "@/tenant/features/enrollments/hooks/useEnrollmentColumnLayout";
import { useEnrollmentsSelection } from "@/tenant/features/enrollments/hooks/useEnrollmentsSelection";

export function useEnrollmentsPageState() {
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "list", label: t("enrollments.list"), icon: ClipboardList },
      { id: "eligibility", label: t("enrollments.eligibility"), icon: UserCheck },
    ],
    [t]
  );
  const permissions = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const {
    canWrite: canWriteEnrollments,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
  } = permissions;

  const TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [tab, setTab] = usePersistedTabState<string>("enrollments_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const directoryFilters = useEnrollmentsDirectoryFilters();
  const {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    sessionFilter,
    setSessionFilter,
  } = directoryFilters;

  const useServerWork = tab === "work" && activeSubTab === "list";
  const {
    data: workPageData,
    isError: isWorkPageError,
    refetch: refetchWorkPage,
  } = useEnrollmentsPaginated({
    page: listPage,
    limit: ENROLLMENTS_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sessionId: sessionFilter !== "all" ? sessionFilter : undefined,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  const enrollments = useMemo(
    () => (workPageData?.enrollments ?? []) as Enrollment[],
    [workPageData]
  );
  const filteredCount = workPageData?.total ?? enrollments.length;

  const [viewing, setViewing] = useState<Enrollment | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const columnLayout = useEnrollmentColumnLayout();
  const selection = useEnrollmentsSelection(enrollments);

  useEffect(() => {
    selection.setSelectedIds([]);
  }, [debouncedSearch, statusFilter, sessionFilter, showDeleted, selection.setSelectedIds]);

  const { logExportAudit } = useEnrollmentMutations();
  const exportColumns = useMemo(() => defaultEnrollmentsExportColumns(t), [t]);
  const exportActions = useEnrollmentsExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    statusFilter,
    sessionFilter,
    viewingDeleted: showDeleted,
    selectedIds: selection.selectedIds,
    logExportAudit,
  });

  useEffect(() => {
    if (!canWriteEnrollments && activeSubTab === "eligibility") {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  useModuleCreateHotkey({
    enabled: canWriteEnrollments && !showDeleted,
    onCreate: () => {
      setTab("work");
      setShowWizard(true);
    },
  });

  const pageActions = useEnrollmentsPageActions({
    enrollments,
    viewing,
    onViewingChange: setViewing,
    onActiveSubTabChange: setActiveSubTab,
  });

  const canSelectEnrollments = canWriteEnrollments || canDelete;

  return {
    t,
    SUB_TABS,
    TABS,
    tab,
    setTab,
    activeSubTab,
    setActiveSubTab,
    canWriteEnrollments,
    canDelete,
    canExport,
    canSelectEnrollments,
    directoryFilters,
    enrollments,
    filteredCount,
    isWorkPageError,
    refetchWorkPage,
    viewing,
    setViewing,
    showWizard,
    setShowWizard,
    pendingDeleteId,
    setPendingDeleteId,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    columnLayout,
    selection,
    exportActions,
    pageActions,
  };
}
