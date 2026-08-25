import React, { type JSX } from 'react';
import { CheckSquare } from 'lucide-react';
import type { MessagingGenderFilter, MessagingRoleFilter, ModuleColumnRegistryEntry } from '@mms/shared';
import { Button } from '@/components/ui/button';
import {
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from '@/components/ui/ModuleFiltersMenuButton';
import { ModuleClearFiltersButton } from '@/components/ui/ModuleClearFiltersButton';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import { FilterChips } from '@/components/ui/FilterChips';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import {
  WORK_SURFACE,
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from '@/components/ui/formStyles';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { SEMANTIC_TEXT } from '@/lib/semanticTone';

export const MESSAGING_RECIPIENTS_SEARCH_INPUT_ID = 'messaging-recipients-search';

export interface MessagingWorkRecipientsToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  searchContact: string;
  genderFilter: MessagingGenderFilter;
  roleFilter: MessagingRoleFilter;
  roleOptions: Array<{ value: string; label: string }>;
  genderOptions: Array<{ value: string; label: string }>;
  selectingReachable: boolean;
  onSearchChange: (value: string) => void;
  onGenderFilterChange: (value: MessagingGenderFilter) => void;
  onRoleFilterChange: (value: MessagingRoleFilter) => void;
  onSelectReachable: (kind: 'phone' | 'email') => void;
  columnRegistry?: ModuleColumnRegistryEntry[];
  updateUserColumnLayout?: (columns: ModuleColumnRegistryEntry[]) => void;
  onResetColumnLayout?: () => void;
  columnCustomizerLabels?: ModuleColumnCustomizerLabels;
}

export const MessagingWorkRecipientsToolbar = React.memo(function MessagingWorkRecipientsToolbar({
  viewMode,
  onViewModeChange,
  searchContact,
  genderFilter,
  roleFilter,
  roleOptions,
  genderOptions,
  selectingReachable,
  onSearchChange,
  onGenderFilterChange,
  onRoleFilterChange,
  onSelectReachable,
  columnRegistry,
  updateUserColumnLayout,
  onResetColumnLayout,
  columnCustomizerLabels,
}: MessagingWorkRecipientsToolbarProps): JSX.Element {
  const { t } = useTranslation();
  const defaultRole = roleOptions[0]?.value ?? 'all';
  const defaultGender = genderOptions[0]?.value ?? 'all';
  const activeFilterCount =
    (roleFilter !== defaultRole ? 1 : 0) + (genderFilter !== defaultGender ? 1 : 0);

  const roleLabel = (value: string): string =>
    roleOptions.find((option) => option.value === value)?.label ?? value;
  const genderLabel = (value: string): string =>
    genderOptions.find((option) => option.value === value)?.label ?? value;

  const clearFilters = (): void => {
    onRoleFilterChange(defaultRole as MessagingRoleFilter);
    onGenderFilterChange(defaultGender as MessagingGenderFilter);
  };

  const chips = [
    ...(roleFilter !== defaultRole
      ? [{ key: `role:${roleFilter}`, label: roleLabel(roleFilter), onRemove: () => onRoleFilterChange(defaultRole as MessagingRoleFilter) }]
      : []),
    ...(genderFilter !== defaultGender
      ? [{ key: `gender:${genderFilter}`, label: genderLabel(genderFilter), onRemove: () => onGenderFilterChange(defaultGender as MessagingGenderFilter) }]
      : []),
  ];

  return (
    <>
      <div
        role="region"
        aria-label={t('messaging.stepSelectRecipients')}
        className={cn(WORK_SURFACE, 'flex flex-col gap-3 p-3 sm:flex-row')}
      >
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={MESSAGING_RECIPIENTS_SEARCH_INPUT_ID}
            value={searchContact}
            onChange={onSearchChange}
            placeholder={t('messaging.search.placeholder')}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <ModuleFilterDropdown
            label={t('common.filters')}
            activeCount={activeFilterCount}
            clearLabel={t('common.clearFilters')}
            onClear={clearFilters}
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

          {activeFilterCount > 0 ? (
            <ModuleClearFiltersButton onClearFilters={clearFilters} label={t('common.clearFilters')} />
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={selectingReachable}
            onClick={() => onSelectReachable('phone')}
            className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE, 'text-xs font-semibold')}
          >
            <CheckSquare className={`me-1 h-3.5 w-3.5 ${SEMANTIC_TEXT.info}`} /> {t('messaging.selectAllValidPhone')}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={selectingReachable}
            onClick={() => onSelectReachable('email')}
            className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE, 'text-xs font-semibold')}
          >
            <CheckSquare className={`me-1 h-3.5 w-3.5 ${SEMANTIC_TEXT.warning}`} /> {t('messaging.selectAllValidEmail')}
          </Button>

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          {columnRegistry && updateUserColumnLayout && columnCustomizerLabels ? (
            <ModuleColumnCustomizer
              columnRegistry={columnRegistry}
              updateUserColumnLayout={updateUserColumnLayout}
              onResetLayout={onResetColumnLayout}
              labels={columnCustomizerLabels}
            />
          ) : null}
        </div>
      </div>

      <FilterChips chips={chips} onClearAll={clearFilters} />
    </>
  );
});
