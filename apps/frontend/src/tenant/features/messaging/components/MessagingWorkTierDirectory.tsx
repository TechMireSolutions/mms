import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageSquareOff, RotateCcw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { ModuleWorkDirectoryEmpty } from '@/components/ui/ModuleWorkDirectoryEmpty';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { FilterChips } from '@/components/ui/FilterChips';
import { Button } from '@/components/ui/button';
import { SEMANTIC_BG, SEMANTIC_TEXT } from '@/lib/semanticTone';
import { MessagingDetail } from './MessagingDetail';
import { MessagingWorkBulkActionBar } from './MessagingWorkBulkActionBar';
import { MessagingListCards } from './MessagingListCards';
import { MessagingListDesktopTable } from './MessagingListDesktopTable';
import { MessagingListFilters } from './MessagingListFilters';
import type { useMessagingWorkTierController } from './useMessagingWorkTierController';

type MessagingWorkTierDirectoryProps = ReturnType<typeof useMessagingWorkTierController> & {
  canWrite: boolean;
  canClearLogs: boolean;
  onClearLogsRequest: () => void;
};

export function MessagingWorkTierDirectory({
  canWrite,
  canClearLogs,
  onClearLogsRequest,
  ...c
}: MessagingWorkTierDirectoryProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <ErrorBoundary fallback={<div className={`p-4 text-sm ${SEMANTIC_TEXT.destructive}`}>Failed to load toolbar</div>}>
        <MessagingListFilters
          viewMode={c.viewMode}
          onViewModeChange={c.setViewMode}
          search={c.search}
          onSearchChange={c.setSearch}
          channel={c.channel}
          onChannelChange={c.setChannel}
          channelOptions={c.channelSelectOptions}
          status={c.status}
          onStatusChange={c.setStatus}
          statusOptions={c.statusOptions}
          category={c.category}
          onCategoryChange={c.setCategory}
          categoryOptions={c.categorySelectOptions}
          startDate={c.startDate}
          onStartDateChange={c.setStartDate}
          endDate={c.endDate}
          onEndDateChange={c.setEndDate}
          hasActiveFilters={c.hasActiveFilters}
          activeFilterCount={c.activeFilterCount}
          onClearFilters={c.clearFilters}
          columnRegistry={c.columnRegistry}
          updateUserColumnLayout={c.updateUserColumnLayout}
          columnCustomizerLabels={c.customizerLabels}
          shownCount={c.logsQuery.logs.length}
        />
      </ErrorBoundary>

      <FilterChips chips={c.filterChips} onClearAll={c.clearFilters} />

      {c.status === 'failed' && c.failedLogs.length > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-xl border border-destructive/30 ${SEMANTIC_BG.destructive} ${SEMANTIC_TEXT.destructive} text-xs shadow-sm`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{c.failedLogs.length} {c.t('messaging.status.failed')}</span>
          </div>
          {canWrite && c.hasBulkResend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => c.handleBulkResendLogs(c.failedLogs)}
              className={`h-8 gap-1 text-xs border-destructive/40 ${SEMANTIC_TEXT.destructive} hover:bg-destructive/20 font-semibold`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{c.t('messaging.resend')}</span>
            </Button>
          )}
        </div>
      )}

      {c.selectedCount > 0 && (
        <MessagingWorkBulkActionBar
          selectedCount={c.selectedCount}
          canWrite={canWrite}
          canClearLogs={canClearLogs}
          onClearSelection={() => c.setSelectedById({})}
          onBulkExport={() => void c.handleExportLogs()}
          onBulkResend={c.handleBulkResend}
          onClearLogsRequest={onClearLogsRequest}
        />
      )}

      <ModuleWorkListStateShell
        isError={c.logsQuery.isError}
        isLoading={c.logsQuery.isPending && c.logsQuery.logs.length === 0}
        isFetching={c.logsQuery.isFetching}
        onRetry={c.logsQuery.refetch}
        errorTitle={c.t('messaging.loadFailed')}
        errorHint={c.t('messaging.loadFailedHint')}
        viewMode={c.viewMode}
        skeletonColumnCount={5}
        useServerWork={true}
        pageData={{
          page: c.logsQuery.page,
          total: c.logsQuery.total,
          limit: c.logsQuery.pageSize,
          hasMore: c.logsQuery.hasMore,
        }}
        onPageChange={c.setLogsPage}
        i18nNamespace="messaging"
        showPagination={c.logsQuery.logs.length > 0}
        loadingLabel={c.t('common.loading')}
      >
        {c.logsQuery.logs.length === 0 ? (
          <ModuleWorkDirectoryEmpty
            icon={MessageSquareOff}
            title={c.hasActiveFilters ? c.t('contacts.noContactsMatchFilters') : c.t('messaging.noLogs')}
            description={c.hasActiveFilters ? c.t('contacts.tryAdjustingFilters') : c.t('messaging.selectRecipientsDesc')}
            hasActiveFilters={c.hasActiveFilters}
            viewingDeleted={false}
            onClearFilters={c.clearFilters}
            clearFiltersLabel={c.t('common.clearFilters')}
            showActiveLabel=""
          />
        ) : c.viewMode === 'cards' ? (
          <MessagingListCards
            logs={c.logsQuery.logs}
            selectedIds={c.selectedById}
            allVisibleSelected={c.allVisibleSelected}
            someVisibleSelected={c.someVisibleSelected}
            selectedCount={c.selectedCount}
            selectedCountLabel={c.selectedCountLabel}
            pageCountLabel={c.pageCountLabel}
            canWrite={canWrite}
            logStatusConfig={c.logStatusConfig}
            getRecipientName={c.getRecipientName}
            isColumnVisible={c.isColumnVisible}
            onToggleLog={c.toggleLog}
            onToggleAllVisible={c.toggleAllVisible}
            onResendLog={c.handleResendLog}
            onViewLog={c.handleOpenDetail}
            onFilterContact={c.handleFilterContact}
          />
        ) : (
          <div className="space-y-2">
            <MessagingListDesktopTable
              logs={c.logsQuery.logs}
              selectedIds={c.selectedById}
              allVisibleSelected={c.allVisibleSelected}
              someVisibleSelected={c.someVisibleSelected}
              canWrite={canWrite}
              logStatusConfig={c.logStatusConfig}
              getRecipientName={c.getRecipientName}
              getColumnWidth={c.getColumnWidth}
              isColumnVisible={c.isColumnVisible}
              setColumnWidth={c.setColumnWidth}
              onToggleLog={c.toggleLog}
              onToggleAllVisible={c.toggleAllVisible}
              onResendLog={c.handleResendLog}
              onViewLog={c.handleOpenDetail}
              onFilterContact={c.handleFilterContact}
            />
            <ModuleTableFooterCount
              selectedCount={c.selectedCount}
              selectedCountLabel={String(c.selectedCountLabel)}
              pageCountLabel={String(c.pageCountLabel)}
            />
          </div>
        )}
      </ModuleWorkListStateShell>

      <MessagingDetail
        log={c.activeDetailLog}
        recipient={c.activeRecipient}
        logStatusConfig={c.logStatusConfig}
        canWrite={canWrite}
        onClose={c.handleCloseDetail}
        onResend={c.handleResendLog}
      />
    </motion.div>
  );
}
