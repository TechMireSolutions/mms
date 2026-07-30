import type { JSX } from 'react';
import { UserPlus } from 'lucide-react';
import type { SystemUser } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { UsersListDesktopTable } from '@/tenant/features/users/components/UsersListDesktopTable';
import { UsersListMobileCards } from '@/tenant/features/users/components/UsersListMobileCards';

interface UsersListContentProps {
  users: SystemUser[];
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  search: string;
  roleFilter: string;
  statusFilter: string;
  onAddUser: () => void;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  formatLoginDate: (timestamp: string) => string;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function UsersListContent({
  users,
  selectedIds,
  canWrite,
  canDelete,
  showDeleted,
  search,
  roleFilter,
  statusFilter,
  onAddUser,
  onToggleSelect,
  onToggleAll,
  formatLoginDate,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onResetPassword,
  getColumnWidth,
  onColumnResize,
}: UsersListContentProps): JSX.Element {
  const { t } = useTranslation();

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <UserPlus className="h-7 w-7 text-primary/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t('users.emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {showDeleted || search || roleFilter !== 'all' || statusFilter !== 'all'
              ? t('users.emptyFiltered')
              : t('users.emptyHint')}
          </p>
        </div>
        {canWrite && !showDeleted && !search && roleFilter === 'all' && statusFilter === 'all' && (
          <Button type="button" onClick={onAddUser}>
            <UserPlus className="h-3.5 w-3.5" />
            {t('users.addFirst')}
          </Button>
        )}
      </div>
    );
  }

  const listProps = {
    users,
    selectedIds,
    canWrite,
    canDelete,
    showDeleted,
    formatLoginDate,
    onToggleSelect,
    onView,
    onEdit,
    onDelete,
    onRestore,
    onResetPassword,
  };

  return (
    <Card accentColor="primary" className="overflow-hidden border-border/80 bg-card/45 p-0 shadow-sm backdrop-blur-sm">
      <UsersListMobileCards {...listProps} />
      <UsersListDesktopTable
        {...listProps}
        onToggleAll={onToggleAll}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />
    </Card>
  );
}
