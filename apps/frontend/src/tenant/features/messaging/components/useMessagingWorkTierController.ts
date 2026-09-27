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
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { buildMessagingWorkFilterChips } from './buildMessagingWorkFilterChips';
import { useMessagingWorkFilters } from './useMessagingWorkFilters';
import { useMessagingWorkTierBulkActions } from './useMessagingWorkTierBulkActions';
import { useMessagingWorkTierKeyboardNav } from './useMessagingWorkTierKeyboardNav';
import { useMessagingWorkTierSelection } from './useMessagingWorkTierSelection';
import { useMessagingWorkTierDetail } from './useMessagingWorkTierDetail';

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

  const filters = useMessagingWorkFilters({
    searchParams,
    setSearchParams,
    controlledChannel,
    controlledOnChannelChange,
  });

  const logsQuery = useMessageLogs({
    channel: filters.channel,
    category: filters.category,
    search: filters.debouncedSearch,
    status: filters.status,
    startDate: filters.queryStartDate,
    endDate: filters.queryEndDate,
    page: filters.logsPage,
    pageSize: MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  });

  const {
    activeDetailLog,
    activeRecipient,
    getRecipient,
    getRecipientName,
    handleOpenDetail,
    handleCloseDetail,
    handleResendLog,
  } = useMessagingWorkTierDetail({
    logs: logsQuery.logs,
    onResend,
    t,
  });

  const {
    columnRegistry,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    customizerLabels,
  } = useMessagingHistoryColumnLayout();

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
    channel: filters.channel,
    category: filters.category,
    debouncedSearch: filters.debouncedSearch,
    status: filters.status,
    queryStartDate: filters.queryStartDate,
    endDate: filters.endDate,
    t,
    getRecipient,
    getRecipientName,
    onResend,
    onBulkResend,
  });

  const handleBulkResend = (targetChannel?: 'whatsapp' | 'sms' | 'email'): void => {
    handleBulkResendLogs(selectedList, targetChannel);
  };

  const failedLogs = logsQuery.logs.filter((l: Message) => l.status === 'failed');

  const handleFilterContact = (contactName: string): void => {
    filters.setSearch(contactName);
    filters.setLogsPage(1);
  };

  const filterChips = buildMessagingWorkFilterChips({
    search: filters.debouncedSearch,
    onSearchChange: filters.setSearch,
    channel: filters.channel,
    onChannelChange: filters.setChannel,
    channelOptions: channelSelectOptions,
    status: filters.status,
    onStatusChange: filters.setStatus,
    statusOptions,
    category: filters.category,
    onCategoryChange: filters.setCategory,
    categoryOptions: categorySelectOptions,
    startDate: filters.queryStartDate || '',
    onStartDateChange: filters.setStartDate,
    endDate: filters.endDate,
    onEndDateChange: filters.setEndDate,
    t,
  });

  return {
    t,
    viewMode,
    setViewMode,
    channelSelectOptions,
    statusOptions,
    categorySelectOptions,
    ...filters,
    columnRegistry,
    updateUserColumnLayout,
    customizerLabels,
    logsQuery,
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
