import type { JSX } from 'react';
import {
  CheckSquare, SlidersHorizontal, XSquare,
} from 'lucide-react';
import type { MessagingGenderFilter, MessagingRoleFilter } from '@mms/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
}: MessagingWorkRecipientsToolbarProps): JSX.Element {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
                activeFilterCount > 0
                  ? 'border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('common.filters')}</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-border bg-card">
            <DropdownMenuLabel className="text-xs">{t('messaging.filterByRole')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={roleFilter}
              onValueChange={(value) => onRoleFilterChange(value as MessagingRoleFilter)}
            >
              {roleOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs">{t('contacts.reportFields.gender')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={genderFilter}
              onValueChange={(value) => onGenderFilterChange(value as MessagingGenderFilter)}
            >
              {genderOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 w-full justify-start px-2 text-sm text-muted-foreground"
                  onClick={() => {
                    onRoleFilterChange(defaultRole as MessagingRoleFilter);
                    onGenderFilterChange(defaultGender as MessagingGenderFilter);
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-xs text-destructive">
              <XSquare className="me-1 h-3.5 w-3.5" /> {t('messaging.clearSelection')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
