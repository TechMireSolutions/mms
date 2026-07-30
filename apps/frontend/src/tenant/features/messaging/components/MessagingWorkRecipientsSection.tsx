import type { JSX } from 'react';
import type {
  Contact,
  MessagingGenderFilter,
  MessagingRoleFilter,
} from '@mms/shared';
import { ListPagination } from '@/components/ui/ListPagination';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';
import { MessagingWorkRecipientsToolbar } from '@/tenant/features/messaging/components/MessagingWorkRecipientsToolbar';
import { MessagingWorkRecipientsList } from '@/tenant/features/messaging/components/MessagingWorkRecipientsList';

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
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs lg:col-span-2">
      <MessagingWorkRecipientsToolbar
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
        contacts={contacts}
        selectedById={selectedById}
        allVisibleSelected={allVisibleSelected}
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
        i18nNamespace="contacts"
        variant="range"
      />
    </div>
  );
}
