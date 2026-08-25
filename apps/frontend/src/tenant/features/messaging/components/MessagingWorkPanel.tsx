import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { ModuleWorkDirectoryEmpty } from '@/components/ui/ModuleWorkDirectoryEmpty';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { notify } from '@/lib/notify';
import { useMessageLogs } from '@/hooks/useMessaging';
import { useMessagingRecipientsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { MessagingDetailDrawer } from './MessagingDetailDrawer';
import { MessagingWorkBulkActionBar } from './MessagingWorkBulkActionBar';
import { MessagingWorkCards } from './MessagingWorkCards';
import { MessagingWorkTable } from './MessagingWorkTable';
import { MessagingWorkToolbar } from './MessagingWorkToolbar';
import {
  exportMessagingLogsFiltered,
  messagingExportEndDateBound,
} from './messagingReportsExport';
import { AlertTriangle, MessageSquareOff, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEMANTIC_BG, SEMANTIC_TEXT } from '@/lib/semanticTone';

export type MessagingSelectedLogsMap = Record<string, Message>;

interface MessagingWorkPanelProps {
  canWrite: boolean;
  canClearLogs: boolean;
  onClearLogsRequest: () => void;
  onResend: (log: Message, recipient: MessagingRecipient) => void;
  onBulkResend?: (logs: Message[], recipients: MessagingRecipient[], targetChannel?: 'whatsapp' | 'sms' | 'email') => void;
  channel?: 'all' | 'sms' | 'whatsapp' | 'email';
  onChannelChange?: (channel: 'all' | 'sms' | 'whatsapp' | 'email') => void;
}

export function MessagingWorkPanel({
  canWrite,
  canClearLogs,
  onClearLogsRequest,
  onResend,
  onBulkResend,
  channel: controlledChannel,
  onChannelChange: controlledOnChannelChange,
}: MessagingWorkPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySelectOptions, channelSelectOptions, statusOptions, logStatusConfig } = useMessagingPageOptions();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  // URL query sync
  const channelParam = searchParams.get('channel') as 'all' | 'sms' | 'whatsapp' | 'email' | null;
  const statusParam = searchParams.get('status') as 'all' | 'sent' | 'delivered' | 'failed' | 'skipped' | null;
  const categoryParam = searchParams.get('category') || null;
  const searchParam = searchParams.get('search') || '';

  const [search, setSearch] = useState(searchParam);
  const [logsPage, setLogsPage] = useState(1);
  const [internalChannel, setInternalChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>(channelParam || 'all');
  const channel = controlledChannel !== undefined ? controlledChannel : internalChannel;
  const setChannel = controlledOnChannelChange !== undefined ? controlledOnChannelChange : setInternalChannel;
  const [category, setCategory] = useState(categoryParam || 'all');
  const [status, setStatus] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'skipped'>(statusParam || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedById, setSelectedById] = useState<MessagingSelectedLogsMap>({});
  const [exporting, setExporting] = useState(false);
  const lastSelectedLogRef = React.useRef<Message | null>(null);

  const debouncedSearch = useDebounce(search, 250);
  const queryStartDate = startDate.trim() || undefined;
  const queryEndDate = endDate.trim() ? messagingExportEndDateBound(endDate) : undefined;

  // Keep URL query params synchronized with active filters
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (channel !== 'all') next.set('channel', channel);
    else next.delete('channel');

    if (status !== 'all') next.set('status', status);
    else next.delete('status');

    if (category !== 'all') next.set('category', category);
    else next.delete('category');

    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
    else next.delete('search');

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [channel, status, category, debouncedSearch, searchParams, setSearchParams]);

  const hasActiveFilters =
    channel !== 'all' ||
    category !== 'all' ||
    status !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(debouncedSearch.trim());

  const activeFilterCount =
    (channel !== 'all' ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const clearFilters = (): void => {
    setChannel('all');
    setCategory('all');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setLogsPage(1);
  };

  const logsQuery = useMessageLogs({
    channel,
    category,
    search: debouncedSearch,
    status,
    startDate: queryStartDate,
    endDate: queryEndDate,
    page: logsPage,
    pageSize: MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  });

  // URL deep-linking for active drawer
  const urlLogId = searchParams.get('logId');
  
  const activeDetailLog = useMemo(() => {
    if (!urlLogId || logsQuery.logs.length === 0) return null;
    return logsQuery.logs.find((l: Message) => String(l.id) === urlLogId) || null;
  }, [urlLogId, logsQuery.logs]);

  const handleOpenDetail = useCallback((log: Message): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('logId', String(log.id));
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const handleCloseDetail = useCallback((): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('logId');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const contactIds = useMemo(() => logsQuery.logs.map((log: Message) => log.contactId), [logsQuery.logs]);
  const { recipientMap, getRecipient } = useMessagingRecipientsByIds(contactIds);

  const {
    columnRegistry,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    customizerLabels,
  } = useMessagingHistoryColumnLayout();

  const getRecipientName = useCallback((contactId: string | number): string => {
    const recipient = getRecipient(contactId);
    return recipient?.name || t('messaging.contactFallback', { id: contactId });
  }, [getRecipient, t]);

  const handleResendLog = useCallback((log: Message): void => {
    const recipient = getRecipient(log.contactId);
    onResend(log, recipient ?? {
      id: log.contactId,
      name: getRecipientName(log.contactId),
      phone: '',
      email: '',
    });
  }, [getRecipient, getRecipientName, onResend]);

  const allVisibleSelected =
    logsQuery.logs.length > 0 && logsQuery.logs.every((log: Message) => Boolean(selectedById[String(log.id)]));
  const someVisibleSelected =
    logsQuery.logs.some((log: Message) => Boolean(selectedById[String(log.id)]));
  const selectedList = useMemo(() => Object.values(selectedById), [selectedById]);
  const selectedCount = selectedList.length;

  const selectedCountLabel = t('messaging.selectedCount', { count: selectedCount });
  const pageCountLabel = formatDirectoryPageCountLabel(logsQuery.logs.length, t, {
    singular: 'messaging.item.recipient',
    plural: 'messaging.item.recipients',
  });

  const toggleLog = useCallback((log: Message, shiftKey?: boolean): void => {
    const key = String(log.id);
    const isCurrentlySelected = Boolean(selectedById[key]);

    if (shiftKey && lastSelectedLogRef.current) {
      const lastIndex = logsQuery.logs.findIndex((l: Message) => String(l.id) === String(lastSelectedLogRef.current?.id));
      const currentIndex = logsQuery.logs.findIndex((l: Message) => String(l.id) === key);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const next = { ...selectedById };

        for (let i = start; i <= end; i++) {
          const item = logsQuery.logs[i];
          if (item) {
            next[String(item.id)] = item;
          }
        }
        setSelectedById(next);
        return;
      }
    }

    lastSelectedLogRef.current = isCurrentlySelected ? null : log;
    const next = { ...selectedById };
    if (next[key]) delete next[key];
    else next[key] = log;
    setSelectedById(next);
  }, [logsQuery.logs, selectedById]);

  const toggleAllVisible = (checked: boolean): void => {
    const next = { ...selectedById };
    logsQuery.logs.forEach((log: Message) => {
      const key = String(log.id);
      if (checked) next[key] = log;
      else delete next[key];
    });
    setSelectedById(next);
  };

  // Keyboard shortcut listener for directory list navigation (Space = toggle, Enter = detail)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (logsQuery.logs.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < logsQuery.logs.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : logsQuery.logs.length - 1));
      } else if (e.key === ' ' && focusedIndex >= 0 && focusedIndex < logsQuery.logs.length) {
        e.preventDefault();
        const targetLog = logsQuery.logs[focusedIndex];
        if (targetLog) toggleLog(targetLog, e.shiftKey);
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < logsQuery.logs.length) {
        e.preventDefault();
        const targetLog = logsQuery.logs[focusedIndex];
        if (targetLog) handleOpenDetail(targetLog);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logsQuery.logs, focusedIndex, toggleLog, handleOpenDetail]);

  const handleBulkResendLogs = useCallback((targetLogs: Message[], targetChannel?: 'whatsapp' | 'sms' | 'email'): void => {
    if (targetLogs.length === 0) return;
    const selectedRecipients: MessagingRecipient[] = targetLogs.map((log) => {
      const rec = getRecipient(log.contactId);
      return rec ?? {
        id: log.contactId,
        name: getRecipientName(log.contactId),
        phone: '',
        email: '',
      };
    });
    if (onBulkResend) {
      onBulkResend(targetLogs, selectedRecipients, targetChannel);
    } else {
      const first = targetLogs[0];
      if (first) onResend(first, selectedRecipients[0]!);
    }
  }, [getRecipient, getRecipientName, onBulkResend, onResend]);

  const handleBulkResend = useCallback((targetChannel?: 'whatsapp' | 'sms' | 'email'): void => {
    handleBulkResendLogs(selectedList, targetChannel);
  }, [handleBulkResendLogs, selectedList]);

  const failedLogs = useMemo(() => logsQuery.logs.filter((l: Message) => l.status === 'failed'), [logsQuery.logs]);

  const handleExportLogs = async (): Promise<void> => {
    if (!canWrite || exporting) return;
    setExporting(true);
    try {
      await exportMessagingLogsFiltered({
        channel,
        category,
        debouncedSearch,
        status,
        startDate: queryStartDate,
        endDate,
        t,
      });
    } catch {
      notify.error(t('messaging.exportFailed'), { description: t('messaging.loadFailedHint') });
    } finally {
      setExporting(false);
    }
  };

  const activeRecipient = useMemo(() => {
    if (!activeDetailLog) return null;
    return getRecipient(activeDetailLog.contactId);
  }, [activeDetailLog, getRecipient]);

  const handleFilterContact = useCallback((contactName: string): void => {
    setSearch(contactName);
    setLogsPage(1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <ErrorBoundary fallback={<div className={`p-4 text-sm ${SEMANTIC_TEXT.destructive}`}>Failed to load toolbar</div>}>
        <MessagingWorkToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          search={search}
          onSearchChange={setSearch}
          channel={channel}
          onChannelChange={setChannel}
          channelOptions={channelSelectOptions}
          status={status}
          onStatusChange={setStatus}
          statusOptions={statusOptions}
          category={category}
          onCategoryChange={setCategory}
          categoryOptions={categorySelectOptions}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          columnRegistry={columnRegistry}
          updateUserColumnLayout={updateUserColumnLayout}
          columnCustomizerLabels={customizerLabels}
        />
      </ErrorBoundary>

      {/* Quick Callout when filtering by failed messages */}
      {status === 'failed' && failedLogs.length > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-xl border border-destructive/30 ${SEMANTIC_BG.destructive} ${SEMANTIC_TEXT.destructive} text-xs shadow-sm`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{failedLogs.length} {t('messaging.status.failed')}</span>
          </div>
          {canWrite && onBulkResend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkResendLogs(failedLogs)}
              className={`h-8 gap-1 text-xs border-destructive/40 ${SEMANTIC_TEXT.destructive} hover:bg-destructive/20 font-semibold`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('messaging.resend')}</span>
            </Button>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <MessagingWorkBulkActionBar
          selectedCount={selectedCount}
          canWrite={canWrite}
          canClearLogs={canClearLogs}
          onClearSelection={() => setSelectedById({})}
          onBulkExport={() => void handleExportLogs()}
          onBulkResend={handleBulkResend}
          onClearLogsRequest={onClearLogsRequest}
        />
      )}

      <ModuleWorkListStateShell
        isError={logsQuery.isError}
        isLoading={logsQuery.isPending && logsQuery.logs.length === 0}
        isFetching={logsQuery.isFetching}
        onRetry={logsQuery.refetch}
        errorTitle={t('messaging.loadFailed')}
        errorHint={t('messaging.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={5}
        useServerWork={true}
        pageData={{
          page: logsQuery.page,
          total: logsQuery.total,
          limit: logsQuery.pageSize,
          hasMore: logsQuery.hasMore,
        }}
        onPageChange={setLogsPage}
        i18nNamespace="messaging"
        showPagination={logsQuery.logs.length > 0}
        loadingLabel={t('common.loading')}
      >
        {logsQuery.logs.length === 0 ? (
          <ModuleWorkDirectoryEmpty
            icon={MessageSquareOff}
            title={hasActiveFilters ? t('contacts.noContactsMatchFilters') : t('messaging.noLogs')}
            description={hasActiveFilters ? t('contacts.tryAdjustingFilters') : t('messaging.selectRecipientsDesc')}
            hasActiveFilters={hasActiveFilters}
            viewingDeleted={false}
            onClearFilters={clearFilters}
            clearFiltersLabel={t('common.clearFilters')}
            showActiveLabel=""
          />
        ) : viewMode === 'cards' ? (
          <MessagingWorkCards
            logs={logsQuery.logs}
            selectedIds={selectedById}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            selectedCount={selectedCount}
            selectedCountLabel={selectedCountLabel}
            pageCountLabel={pageCountLabel}
            canWrite={canWrite}
            logStatusConfig={logStatusConfig}
            getRecipientName={getRecipientName}
            isColumnVisible={isColumnVisible}
            onToggleLog={toggleLog}
            onToggleAllVisible={toggleAllVisible}
            onResendLog={handleResendLog}
            onViewLog={handleOpenDetail}
            onFilterContact={handleFilterContact}
          />
        ) : (
          <div className="space-y-2">
            <MessagingWorkTable
              logs={logsQuery.logs}
              selectedIds={selectedById}
              allVisibleSelected={allVisibleSelected}
              someVisibleSelected={someVisibleSelected}
              canWrite={canWrite}
              logStatusConfig={logStatusConfig}
              getRecipientName={getRecipientName}
              getColumnWidth={getColumnWidth}
              isColumnVisible={isColumnVisible}
              setColumnWidth={setColumnWidth}
              onToggleLog={toggleLog}
              onToggleAllVisible={toggleAllVisible}
              onResendLog={handleResendLog}
              onViewLog={handleOpenDetail}
              onFilterContact={handleFilterContact}
            />
            <ModuleTableFooterCount
              selectedCount={selectedCount}
              selectedCountLabel={String(selectedCountLabel)}
              pageCountLabel={String(pageCountLabel)}
            />
          </div>
        )}
      </ModuleWorkListStateShell>

      <MessagingDetailDrawer
        log={activeDetailLog}
        recipient={activeRecipient}
        logStatusConfig={logStatusConfig}
        canWrite={canWrite}
        onClose={handleCloseDetail}
        onResend={handleResendLog}
      />
    </motion.div>
  );
}
