import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkspaceSortDirection, WorkspaceSortField } from '@/platform/components/platformWorkspaceListData';

const SORT_MENU_ITEMS: { field: WorkspaceSortField; labelKey: 'platform.sort.name' | 'platform.sort.subdomain' | 'platform.sort.createdAt' | 'platform.sort.status' }[] = [
  { field: 'name', labelKey: 'platform.sort.name' },
  { field: 'subdomain', labelKey: 'platform.sort.subdomain' },
  { field: 'createdAt', labelKey: 'platform.sort.createdAt' },
  { field: 'status', labelKey: 'platform.sort.status' },
];

export interface PlatformWorkspaceSortMenuProps {
  sortField: WorkspaceSortField;
  sortDirection: WorkspaceSortDirection;
  onToggleSort: (field: WorkspaceSortField) => void;
}

/** Sort-by dropdown with active-column direction arrows. */
export function PlatformWorkspaceSortMenu({
  sortField,
  sortDirection,
  onToggleSort,
}: PlatformWorkspaceSortMenuProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer select-none"
        >
          <ArrowUpDown className="w-3.5 h-3.5" aria-hidden />
          {t('platform.sort.sortBy')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
        {SORT_MENU_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.field}
            onClick={() => onToggleSort(item.field)}
            className="text-xs font-semibold cursor-pointer"
          >
            {t(item.labelKey)} {sortField === item.field ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}