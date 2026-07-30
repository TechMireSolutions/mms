import type { JSX } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import type { SystemUser } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useTranslation } from '@/hooks/useTranslation';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { UsersListAvatar } from '@/tenant/features/users/components/UsersListAvatar';
import { UsersListRowActions } from '@/tenant/features/users/components/UsersListRowActions';

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

  return (
    <Card accentColor="primary" className="overflow-hidden border-border/80 bg-card/45 p-0 shadow-sm backdrop-blur-sm">
      <div className="space-y-3 p-3 md:hidden">
        {users.map((user) => (
          <motion.article
            key={user.id}
            layout
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <UsersListAvatar user={user} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {canDelete ? (
                <Checkbox
                  checked={selectedIds.includes(user.id)}
                  onCheckedChange={() => onToggleSelect(user.id)}
                  aria-label={t('users.selectRow', { name: user.name })}
                />
              ) : null}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('users.colRole')}</dt>
                <dd><UserRoleBadge roleId={user.role} /></dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('users.colStatus')}</dt>
                <dd><UserStatusBadge status={user.status} /></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('users.colLastLogin')}</dt>
                <dd className="text-xs text-muted-foreground">{formatLoginDate(user.lastLogin)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('users.colCreated')}</dt>
                <dd className="font-mono text-xs text-muted-foreground">{user.createdDate}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('users.col2fa')}</dt>
                <dd>
                  <SettingsMetaBadge variant={user.twoFactorEnabled ? 'success' : 'muted'}>
                    {user.twoFactorEnabled ? t('users.twoFactorOn') : t('users.twoFactorOff')}
                  </SettingsMetaBadge>
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2">
              <UsersListRowActions
                user={user}
                canWrite={canWrite}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                onResetPassword={onResetPassword}
              />
            </div>
          </motion.article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border bg-muted/60">
            <tr>
              {canDelete && (
                <th className="w-8 px-3 py-2.5">
                  <Checkbox
                    checked={selectedIds.length === users.length && users.length > 0}
                    onCheckedChange={onToggleAll}
                    aria-label={t('users.selectAll')}
                  />
                </th>
              )}
              <ResizableTableHead columnKey="user" width={getColumnWidth?.('user')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colUser')}
              </ResizableTableHead>
              <ResizableTableHead columnKey="role" width={getColumnWidth?.('role')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colRole')}
              </ResizableTableHead>
              <ResizableTableHead columnKey="status" width={getColumnWidth?.('status')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colStatus')}
              </ResizableTableHead>
              <ResizableTableHead columnKey="lastLogin" width={getColumnWidth?.('lastLogin')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colLastLogin')}
              </ResizableTableHead>
              <ResizableTableHead columnKey="created" width={getColumnWidth?.('created')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colCreated')}
              </ResizableTableHead>
              <ResizableTableHead columnKey="twoFactor" width={getColumnWidth?.('twoFactor')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold uppercase text-muted-foreground">
                {t('users.col2fa')}
              </ResizableTableHead>
              <th className="px-3 py-2.5 text-end text-xs font-semibold uppercase text-muted-foreground">
                {t('users.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <motion.tr key={user.id} layout className="transition-colors hover:bg-muted/20">
                {canDelete && (
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={selectedIds.includes(user.id)}
                      onCheckedChange={() => onToggleSelect(user.id)}
                      aria-label={t('users.selectRow', { name: user.name })}
                    />
                  </td>
                )}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <UsersListAvatar user={user} />
                    <div>
                      <p className="whitespace-nowrap text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <UserRoleBadge roleId={user.role} />
                </td>
                <td className="px-3 py-2.5">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatLoginDate(user.lastLogin)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                  {user.createdDate}
                </td>
                <td className="px-3 py-2.5">
                  <SettingsMetaBadge variant={user.twoFactorEnabled ? 'success' : 'muted'}>
                    {user.twoFactorEnabled ? t('users.twoFactorOn') : t('users.twoFactorOff')}
                  </SettingsMetaBadge>
                </td>
                <td className="px-3 py-2.5 text-end">
                  <UsersListRowActions
                    user={user}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onResetPassword={onResetPassword}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
