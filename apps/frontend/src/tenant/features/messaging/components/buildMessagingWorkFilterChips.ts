import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { FilterChip } from '@/components/ui/FilterChips';

interface BuildMessagingWorkFilterChipsOptions {
  search: string;
  onSearchChange: (value: string) => void;
  channel: string;
  onChannelChange: (val: any) => void;
  channelOptions: Array<{ value: string; label: string }>;
  status: string;
  onStatusChange: (val: any) => void;
  statusOptions: Array<{ value: string; label: string }>;
  category: string;
  onCategoryChange: (val: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  t: TranslationFunction;
}

export function buildMessagingWorkFilterChips({
  search,
  onSearchChange,
  channel,
  onChannelChange,
  channelOptions,
  status,
  onStatusChange,
  statusOptions,
  category,
  onCategoryChange,
  categoryOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  t,
}: BuildMessagingWorkFilterChipsOptions): FilterChip[] {
  const channelLabel = channelOptions.find((o) => o.value === channel)?.label ?? channel;
  const statusLabel = statusOptions.find((o) => o.value === status)?.label ?? status;
  const categoryLabel = categoryOptions.find((o) => o.value === category)?.label ?? category;

  return [
    search.trim() ? { key: `search:${search}`, label: `${t('common.search')}: "${search.trim()}"`, onRemove: () => onSearchChange('') } : null,
    channel !== 'all' ? { key: `channel:${channel}`, label: `${t('messaging.channel')}: ${channelLabel}`, onRemove: () => onChannelChange('all') } : null,
    status !== 'all' ? { key: `status:${status}`, label: `${t('common.status')}: ${statusLabel}`, onRemove: () => onStatusChange('all') } : null,
    category !== 'all' ? { key: `category:${category}`, label: `${t('messaging.category')}: ${categoryLabel}`, onRemove: () => onCategoryChange('all') } : null,
    startDate ? { key: `from:${startDate}`, label: `${t('messaging.dateFrom')}: ${startDate}`, onRemove: () => onStartDateChange('') } : null,
    endDate ? { key: `to:${endDate}`, label: `${t('messaging.dateTo')}: ${endDate}`, onRemove: () => onEndDateChange('') } : null,
  ].flatMap(c => c ? [c] : []);
}
