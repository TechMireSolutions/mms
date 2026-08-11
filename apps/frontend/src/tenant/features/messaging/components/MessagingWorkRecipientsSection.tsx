import type { JSX, ReactNode } from 'react';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type {
  Contact,
  MessagingGenderFilter,
  MessagingRoleFilter,
} from '@mms/shared';
import { ListPagination } from '@/components/ui/ListPagination';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';
import { MessagingWorkRecipientsToolbar } from '@/tenant/features/messaging/components/MessagingWorkRecipientsToolbar';
import { MessagingWorkRecipientsList } from '@/tenant/features/messaging/components/MessagingWorkRecipientsList';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingWorkRecipientsSectionProps {
  contacts: Contact[];
  selectedById: MessagingSelectedMap;
  searchContact: string;
  genderFilter: MessagingGenderFilter;
  roleFilter: MessagingRoleFilter;
  roleOptions: Array<{ value: string; label: string }>;
  genderOptions: Array<{ value: string; label: string }>;
  selectingReachable: boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  selectedCountLabel: ReactNode;
  pageCountLabel: ReactNode;
  isPending: boolean;
  isFetching: boolean;
  recipientsPage: number;
  recipientsTotal: number;
  recipientsLimit: number;
  recipientsHasMore: boolean;
  getColumnWidth: (key: string) => number | undefined;
  onSearchChange: (value: string) => void;
  onGenderFilterChange: (value: MessagingGenderFilter) => void;
  onRoleFilterChange: (value: MessagingRoleFilter) => void;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
  onSelectReachable: (kind: 'phone' | 'email') => void;
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  setColumnWidth: (key: string, width: number) => void;
  selectedCount: number;
}

export function MessagingWorkRecipientsSection({
  contacts,
  selectedById,
  searchContact,
  genderFilter,
  roleFilter,
  roleOptions,
  genderOptions,
  selectingReachable,
  allVisibleSelected,
  someVisibleSelected,
  selectedCountLabel,
  pageCountLabel,
  isPending,
  isFetching,
  recipientsPage,
  recipientsTotal,
  recipientsLimit,
  recipientsHasMore,
  getColumnWidth,
  onSearchChange,
  onGenderFilterChange,
  onRoleFilterChange,
  onToggleRecipient,
  onToggleAllVisible,
  onSelectReachable,
  onClearSelection,
  onPageChange,
  setColumnWidth,
  selectedCount,
}: MessagingWorkRecipientsSectionProps): JSX.Element {
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { t } = useTranslation();
  return (
    <div className={`${WORK_SURFACE} space-y-4 p-4 lg:col-span-2`}>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">{t('messaging.stepSelectRecipients')}</h4>
        <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
      </div>
      <MessagingWorkRecipientsToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchContact={searchContact}
        genderFilter={genderFilter}
        roleFilter={roleFilter}
        roleOptions={roleOptions}
        genderOptions={genderOptions}
        selectingReachable={selectingReachable}
        selectedCount={selectedCount}
        onSearchChange={onSearchChange}
        onGenderFilterChange={onGenderFilterChange}
        onRoleFilterChange={onRoleFilterChange}
        onSelectReachable={onSelectReachable}
        onClearSelection={onClearSelection}
      />
      <MessagingWorkRecipientsList
        viewMode={viewMode}
        contacts={contacts}
        selectedById={selectedById}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        selectedCount={selectedCount}
        selectedCountLabel={selectedCountLabel}
        pageCountLabel={pageCountLabel}
        isPending={isPending}
        isFetching={isFetching}
        getColumnWidth={getColumnWidth}
        onToggleRecipient={onToggleRecipient}
        onToggleAllVisible={onToggleAllVisible}
        setColumnWidth={setColumnWidth}
      />
      <ListPagination
        page={recipientsPage}
        total={recipientsTotal}
        limit={recipientsLimit}
        hasMore={recipientsHasMore}
        onPageChange={onPageChange}
        i18nNamespace="messaging"
        variant="range"
      />
    </div>
  );
}
