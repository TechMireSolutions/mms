import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { useMessageLogs } from '@/hooks/useMessaging';
import { useMessagingRecipientsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { buildMessagingWorkFilterChips } from './buildMessagingWorkFilterChips';
import { messagingExportEndDateBound } from './messagingReportsExport';
import { useMessagingWorkTierBulkActions } from './useMessagingWorkTierBulkActions';
import { useMessagingWorkTierKeyboardNav } from './useMessagingWorkTierKeyboardNav';
import { useMessagingWorkTierSelection } from './useMessagingWorkTierSelection';
import { useMessagingWorkTierUrlSync } from './useMessagingWorkTierUrlSync';

export interface MessagingWorkTierControllerProps {
  canWrite: boolean;
  onClearLogsRequest: () => void;
  onResend: (log: Message, recipient: MessagingRecipient) => void;
  onBulkResend?: (logs: Message[], recipients: MessagingRecipient[], targetChannel?: 'whatsapp' | 'sms' | 'email') => void;
  channel?: 'all' | 'sms' | 'whatsapp' | 'email';
  onChannelChange?: (channel: 'all' | 'sms' | 'whatsapp' | 'email') => void;
}

export function useMessagingWorkTierController({
  canWrite,
  onResend,
  onBulkResend,
  channel: controlledChannel,
  onChannelChange: controlledOnChannelChange,
}: MessagingWorkTierControllerProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySelectOptions, channelSelectOptions, statusOptions, logStatusConfig } = useMessagingPageOptions();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

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

  const debouncedSearch = useDebounce(search, 250);
  const queryStartDate = startDate.trim() || undefined;
  const queryEndDate = endDate.trim() ? messagingExportEndDateBound(endDate) : undefined;

  useMessagingWorkTierUrlSync({
    searchParams,
    setSearchParams,
    channel,
    status,
    category,
    debouncedSearch,
  });

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
  const { getRecipient } = useMessagingRecipientsByIds(contactIds);

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

  const {
    selectedById,
    setSelectedById,
    allVisibleSelected,
    someVisibleSelected,
    selectedList,
    selectedCount,
    toggleLog,
    toggleAllVisible,
  } = useMessagingWorkTierSelection({ logs: logsQuery.logs });

  const selectedCountLabel = t('messaging.selectedCount', { count: selectedCount });
  const pageCountLabel = formatDirectoryPageCountLabel(logsQuery.logs.length, t, {
    singular: 'messaging.item.recipient',
    plural: 'messaging.item.recipients',
  });

  useMessagingWorkTierKeyboardNav({
    logs: logsQuery.logs,
    toggleLog,
    handleOpenDetail,
  });

  const { handleBulkResendLogs, handleExportLogs } = useMessagingWorkTierBulkActions({
    canWrite,
    channel,
    category,
    debouncedSearch,
    status,
    queryStartDate,
    endDate,
    t,
    getRecipient,
    getRecipientName,
    onResend,
    onBulkResend,
  });

  const handleBulkResend = useCallback((targetChannel?: 'whatsapp' | 'sms' | 'email'): void => {
    handleBulkResendLogs(selectedList, targetChannel);
  }, [handleBulkResendLogs, selectedList]);

  const failedLogs = useMemo(() => logsQuery.logs.filter((l: Message) => l.status === 'failed'), [logsQuery.logs]);

  const activeRecipient = useMemo(() => {
    if (!activeDetailLog) return null;
    return getRecipient(activeDetailLog.contactId);
  }, [activeDetailLog, getRecipient]);

  const handleFilterContact = useCallback((contactName: string): void => {
    setSearch(contactName);
    setLogsPage(1);
  }, []);

  const filterChips = useMemo(() => buildMessagingWorkFilterChips({
    search: debouncedSearch,
    onSearchChange: setSearch,
    channel,
    onChannelChange: setChannel,
    channelOptions: channelSelectOptions,
    status,
    onStatusChange: setStatus,
    statusOptions,
    category,
    onCategoryChange: setCategory,
    categoryOptions: categorySelectOptions,
    startDate: queryStartDate || '',
    onStartDateChange: setStartDate,
    endDate,
    onEndDateChange: setEndDate,
    t,
  }), [
    debouncedSearch, channel, status, category, queryStartDate, endDate,
    channelSelectOptions, statusOptions, categorySelectOptions, t
  ]);

  return {
    t,
    viewMode,
    setViewMode,
    search,
    setSearch,
    channel,
    setChannel,
    channelSelectOptions,
    status,
    setStatus,
    statusOptions,
    category,
    setCategory,
    categorySelectOptions,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
    columnRegistry,
    updateUserColumnLayout,
    customizerLabels,
    logsQuery,
    setLogsPage,
    selectedById,
    setSelectedById,
    allVisibleSelected,
    someVisibleSelected,
    selectedCount,
    selectedCountLabel,
    pageCountLabel,
    toggleLog,
    toggleAllVisible,
    handleResendLog,
    handleOpenDetail,
    handleCloseDetail,
    handleBulkResend,
    handleBulkResendLogs,
    handleExportLogs,
    failedLogs,
    hasBulkResend: Boolean(onBulkResend),
    activeDetailLog,
    activeRecipient,
    handleFilterContact,
    filterChips,
    logStatusConfig,
    getRecipientName,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
  };
}
