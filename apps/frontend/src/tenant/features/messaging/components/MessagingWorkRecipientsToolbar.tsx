import type { ReactElement } from 'react';
import {
  CheckSquare, XSquare,
} from 'lucide-react';
import type { MessagingGenderFilter, MessagingRoleFilter } from '@mms/shared';
import { Button } from '@/components/ui/button';
import {
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from '@/components/ui/ModuleFiltersMenuButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingWorkRecipientsToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  searchContact: string;
  genderFilter: MessagingGenderFilter;
  roleFilter: MessagingRoleFilter;
  roleOptions: Array<{ value: string; label: string }>;
  genderOptions: Array<{ value: string; label: string }>;
  selectingReachable: boolean;
  selectedCount: number;
  onSearchChange: (value: string) => void;
  onGenderFilterChange: (value: MessagingGenderFilter) => void;
  onRoleFilterChange: (value: MessagingRoleFilter) => void;
  onSelectReachable: (kind: 'phone' | 'email') => void;
  onClearSelection: () => void;
}

export function MessagingWorkRecipientsToolbar({
  viewMode,
  onViewModeChange,
  searchContact,
  genderFilter,
  roleFilter,
  roleOptions,
  genderOptions,
  selectingReachable,
  selectedCount,
  onSearchChange,
  onGenderFilterChange,
  onRoleFilterChange,
  onSelectReachable,
  onClearSelection,
}: MessagingWorkRecipientsToolbarProps): ReactElement {
  const { t } = useTranslation();
  const defaultRole = roleOptions[0]?.value ?? 'all';
  const defaultGender = genderOptions[0]?.value ?? 'all';
  const activeFilterCount =
    (roleFilter !== defaultRole ? 1 : 0) + (genderFilter !== defaultGender ? 1 : 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">{t('messaging.stepSelectRecipients')}</h4>
          <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
        </div>
        <ModuleFilterDropdown
          label={t('common.filters')}
          activeCount={activeFilterCount}
          clearLabel={t('common.clearFilters')}
          onClear={() => {
            onRoleFilterChange(defaultRole as MessagingRoleFilter);
            onGenderFilterChange(defaultGender as MessagingGenderFilter);
          }}
        >
          <ModuleFilterRadioGroup
            label={t('messaging.filterByRole')}
            value={roleFilter}
            onValueChange={(value) => onRoleFilterChange(value as MessagingRoleFilter)}
            options={roleOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <ModuleFilterDivider />
          <ModuleFilterRadioGroup
            label={t('contacts.reportFields.gender')}
            value={genderFilter}
            onValueChange={(value) => onGenderFilterChange(value as MessagingGenderFilter)}
            options={genderOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </ModuleFilterDropdown>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBar
          placeholder={t('messaging.search.placeholder')}
          value={searchContact}
          onChange={onSearchChange}
          className="max-w-sm flex-grow"
        />
        <div className="flex max-w-full flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <Button
            variant="outline"
            size="sm"
            disabled={selectingReachable}
            onClick={() => onSelectReachable('phone')}
            className="text-xs font-semibold"
          >
            <CheckSquare className="me-1 h-3.5 w-3.5 text-info" /> {t('messaging.selectAllValidPhone')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectingReachable}
            onClick={() => onSelectReachable('email')}
            className="text-xs font-semibold"
          >
            <CheckSquare className="me-1 h-3.5 w-3.5 text-warning" /> {t('messaging.selectAllValidEmail')}
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 min-h-11"
            >
              <XSquare className="me-1 h-3.5 w-3.5" /> {t('messaging.clearSelection')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
