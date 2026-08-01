import React, { useState, useMemo, useEffect } from "react";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { Enrollment } from '@/lib/data/enrollmentData';
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { EnrollmentListContent, type EnrollmentListVisibleColumns } from "@/tenant/features/enrollments/components/EnrollmentListContent";
import { EnrollmentListToolbar } from "@/tenant/features/enrollments/components/EnrollmentListToolbar";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const PAGE_SIZE = 12;

interface EnrollmentListProps {
  enrollments: Enrollment[];
  canWrite: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onShowDeletedChange?: (showDeleted: boolean) => void;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

/**
 * Renders a paginated, filterable table list of enrollment records.
 */
export function EnrollmentList({
  enrollments,
  canWrite,
  canDelete = false,
  showDeleted = false,
  onShowDeletedChange,
  onView,
  onCancel,
  onDelete,
  onRestore,
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: EnrollmentListProps): React.ReactElement {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { formatCurrency } = useFinanceCurrency();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [statusFilter, setStatus]   = useState<string>("all");
  const [sessionFilter, setSession] = useState<string>("all");

  const sessions = useSessionsCollection();

  const baseFiltered = useMemo<Enrollment[]>(() => {
    return enrollments.filter((enrollment) => {
      if (statusFilter !== "all" && enrollment.status !== statusFilter) return false;
      if (sessionFilter !== "all" && enrollment.sessionId !== sessionFilter) return false;
      return true;
    });
  }, [enrollments, statusFilter, sessionFilter]);

  const {
    searchQuery: search,
    currentPage: page,
    setCurrentPage: setPage,
    handleSearchChange,
    paginatedItems: paginatedEnrollments,
    filteredItems: filtered,
  } = useLocalPagination({
    items: baseFiltered,
    pageSize: PAGE_SIZE,
    searchFields: (enrollment) => [enrollment.studentName, enrollment.sessionName],
  });

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    setPage(1);
  }, [showDeleted, setPage]);

  const { data: students = [] } = useStudentsByIds(paginatedEnrollments.map((enrollment) => enrollment.studentId));

  const visibleColumns: EnrollmentListVisibleColumns = {
    student: isColumnVisible ? isColumnVisible("student") : true,
    session: isColumnVisible ? isColumnVisible("session") : true,
    class: isColumnVisible ? isColumnVisible("class") : true,
    enrolledDate: isColumnVisible ? isColumnVisible("enrolledDate") : true,
    finalFee: isColumnVisible ? isColumnVisible("finalFee") : true,
    status: isColumnVisible ? isColumnVisible("status") : true,
    payment: isColumnVisible ? isColumnVisible("payment") : true,
  };

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    pending: { label: t("enrollments.status.pending"), cls: SEMANTIC_BADGE.warning },
    confirmed: { label: t("enrollments.status.confirmed"), cls: SEMANTIC_BADGE.success },
    cancelled: { label: t("enrollments.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
    completed: { label: t("enrollments.status.completed"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const paymentConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("enrollments.payment.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("enrollments.payment.pending"), cls: SEMANTIC_BADGE.warning },
    none: { label: t("enrollments.payment.none"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  return (
    <section className="space-y-4" aria-label={t("enrollments.list")}>
      <EnrollmentListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        statusFilter={statusFilter}
        sessionFilter={sessionFilter}
        sessions={sessions}
        showDeleted={showDeleted}
        canDelete={canDelete}
        statusConfig={statusConfig}
        columnCustomizer={columnCustomizer}
        onSearchChange={handleSearchChange}
        onStatusChange={(value) => { setStatus(value); setPage(1); }}
        onSessionChange={(value) => { setSession(value); setPage(1); }}
        onShowDeletedChange={onShowDeletedChange}
      />

      <EnrollmentListContent
          viewMode={viewMode}
        enrollments={paginatedEnrollments}
        filteredCount={filtered.length}
        page={page}
        pageSize={PAGE_SIZE}
        students={students}
        visibleColumns={visibleColumns}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        statusConfig={statusConfig}
        paymentConfig={paymentConfig}
        formatCurrency={formatCurrency}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onPageChange={setPage}
        onView={onView}
        onCancel={onCancel}
        onDelete={onDelete}
        onRestore={onRestore}
        openComposer={openComposer}
      />

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </section>
  );
}
