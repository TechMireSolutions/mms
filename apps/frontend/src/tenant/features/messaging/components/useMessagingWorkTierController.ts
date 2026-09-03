import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { useMessageLogs } from '@/hooks/useMessaging';
import { useMessagingRecipientsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { buildMessagingWorkFilterChips } from './buildMessagingWorkFilterChips';
import { useMessagingWorkFilters } from './useMessagingWorkFilters';
import { useMessagingWorkTierBulkActions } from './useMessagingWorkTierBulkActions';
import { useMessagingWorkTierKeyboardNav } from './useMessagingWorkTierKeyboardNav';
import { useMessagingWorkTierSelection } from './useMessagingWorkTierSelection';

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

  const {
    search,
    setSearch,
    debouncedSearch,
    logsPage,
    setLogsPage,
    channel,
    setChannel,
    category,
    setCategory,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    queryStartDate,
    queryEndDate,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
  } = useMessagingWorkFilters({
    searchParams,
    setSearchParams,
    controlledChannel,
    controlledOnChannelChange,
  });

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

  const activeDetailLog = (() => {
    if (!urlLogId || logsQuery.logs.length === 0) return null;
    return logsQuery.logs.find((l: Message) => String(l.id) === urlLogId) || null;
  })();

  const handleOpenDetail = ((log: Message): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('logId', String(log.id));
        return next;
      },
      { replace: true }
    );
  });

  const handleCloseDetail = ((): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('logId');
        return next;
      },
      { replace: true }
    );
  });

  const contactIds = (() => logsQuery.logs.map((log: Message) => log.contactId))();
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

  const handleResendLog = ((log: Message): void => {
    const recipient = getRecipient(log.contactId);
    onResend(log, recipient ?? {
      id: log.contactId,
      name: getRecipientName(log.contactId),
      phone: '',
      email: '',
    });
  });

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

  const handleBulkResend = ((targetChannel?: 'whatsapp' | 'sms' | 'email'): void => {
    handleBulkResendLogs(selectedList, targetChannel);
  });

  const failedLogs = (() => logsQuery.logs.filter((l: Message) => l.status === 'failed'))();

  const activeRecipient = (() => {
    if (!activeDetailLog) return null;
    return getRecipient(activeDetailLog.contactId);
  })();

  const handleFilterContact = ((contactName: string): void => {
    setSearch(contactName);
    setLogsPage(1);
  });

  const filterChips = (() => buildMessagingWorkFilterChips({
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
  }))();

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
