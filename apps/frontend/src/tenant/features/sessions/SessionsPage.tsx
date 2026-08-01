import { AnimatePresence } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ActionButton } from '@/components/ui/ActionButton';
import { SessionsDialogLayer } from '@/tenant/features/sessions/components/SessionsDialogLayer';
import { SessionsReportsTier } from '@/tenant/features/sessions/components/SessionsReportsTier';
import { SessionsSetupTier } from '@/tenant/features/sessions/components/SessionsSetupTier';
import { SessionsWorkTier } from '@/tenant/features/sessions/components/SessionsWorkTier';
import { SessionsCommandMetrics } from '@/tenant/features/sessions/components/SessionsCommandMetrics';
import { useSessionsPageController } from '@/tenant/features/sessions/hooks/useSessionsPageController';

export default function Sessions() {
  const c = useSessionsPageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t('nav.sessions')}`}
      seoDescription={c.t('page.sessions.subtitle')}
      headerIcon={Calendar}
      headerTitle={c.t('nav.sessions')}
      headerSubtitle={c.t('page.sessions.subtitle')}
      headerActions={
        c.canWrite && !c.showDeleted ? (
          <ActionButton variant="primary" icon={Plus} onClick={c.openCreateForm}>
            {c.t('sessions.action.new')}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <SessionsCommandMetrics total={c.shownCount} shown={c.sessions.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.activeTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="sessions-tab"
      >
        <AnimatePresence mode="wait">
          {c.activeTab === 'work' ? (
            <SessionsWorkTier
              search={c.search}
              filterStatus={c.filterStatus}
              filterType={c.filterType}
              statusOptions={c.statusOptions}
              typeOptions={c.typeOptions}
              statusLabels={c.statusLabels}
              typeLabels={c.typeLabels}
              viewMode={c.viewMode}
              onViewModeChange={c.setViewMode}
              columnLayout={c.columnLayout}
              canWrite={c.canWrite}
              canDelete={c.canDelete}
              showDeleted={c.showDeleted}
              sessions={c.sessions}
              workPageData={c.workPageData}
              isError={c.isError}
              isWorkLoading={c.isWorkLoading}
              isWorkFetching={c.isWorkFetching}
              useServerWork={c.useServerWork}
              canSelectSessions={c.canSelectSessions}
              selectedIds={c.selectedIds}
              allVisibleSelected={c.allVisibleSelected}
              someVisibleSelected={c.someVisibleSelected}
              sortField={c.sortField}
              sortDir={c.sortDir}
              statusConfig={c.statusConfig}
              typeConfig={c.typeConfig}
              onSearchChange={c.setSearch}
              onStatusFilterToggle={(statusOption) => c.toggleFilter(c.filterStatus, c.setFilterStatus, statusOption)}
              onTypeFilterToggle={(typeOption) => c.toggleFilter(c.filterType, c.setFilterType, typeOption)}
              onClearFilters={() => { c.setFilterStatus([]); c.setFilterType([]); }}
              onToggleDeleted={() => c.setShowDeleted((previous) => !previous)}
              onRetry={() => void c.refetch()}
              onCreateSession={c.openCreateForm}
              onOpenDetail={c.setDetailSession}
              onSort={c.handleSort}
              onToggleSelectAll={c.toggleSelectAll}
              onToggleSelectedSession={c.toggleSelectedSession}
              onRequestDelete={c.setPendingDeleteId}
              onRestore={c.handleRestore}
              onRequestBulkDelete={() => c.setConfirmBulkDeleteOpen(true)}
              onRequestBulkRestore={() => c.setConfirmBulkRestoreOpen(true)}
              onPageChange={c.setListPage}
            />
          ) : c.activeTab === 'reports' ? (
            <SessionsReportsTier />
          ) : c.activeTab === 'setup' ? (
            <SessionsSetupTier />
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <SessionsDialogLayer
        showForm={c.showForm}
        editSession={c.editSession}
        detailSession={c.detailSession}
        showDeleted={c.showDeleted}
        pendingDeleteId={c.pendingDeleteId}
        confirmBulkDeleteOpen={c.confirmBulkDeleteOpen}
        confirmBulkRestoreOpen={c.confirmBulkRestoreOpen}
        selectedCount={c.selectedIds.length}
        t={c.t}
        onCloseForm={c.closeForm}
        onSave={c.handleSave}
        onCloseDetail={() => c.setDetailSession(null)}
        onUpdate={c.handleUpdate}
        onEdit={c.openEditForm}
        onPendingDeleteOpenChange={(open) => { if (!open) c.setPendingDeleteId(null); }}
        onConfirmDelete={c.confirmDelete}
        onBulkDeleteOpenChange={c.setConfirmBulkDeleteOpen}
        onConfirmBulkDelete={c.handleBulkDelete}
        onBulkRestoreOpenChange={c.setConfirmBulkRestoreOpen}
        onConfirmBulkRestore={c.handleBulkRestore}
      />
    </ModulePageShell>
  );
}
