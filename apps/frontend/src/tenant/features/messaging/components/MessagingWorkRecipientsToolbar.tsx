import type { JSX } from 'react';
import {
  CheckSquare, Filter, XSquare,
} from 'lucide-react';
import type { MessagingGenderFilter, MessagingRoleFilter } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingWorkRecipientsToolbarProps {
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

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">{t('messaging.stepSelectRecipients')}</h4>
          <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" /> {t('messaging.filterByRole')}:
            </span>
            <SegmentedPillFilter
              options={roleOptions}
              value={roleFilter}
              onChange={(value) => onRoleFilterChange(value as MessagingRoleFilter)}
              size="sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('contacts.reportFields.gender')}:</span>
            <SegmentedPillFilter
              options={genderOptions}
              value={genderFilter}
              onChange={(value) => onGenderFilterChange(value as MessagingGenderFilter)}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBar
          placeholder={t('messaging.search.placeholder')}
          value={searchContact}
          onChange={onSearchChange}
          className="max-w-sm flex-grow"
        />
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full text-xs">
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
