import type { JSX } from 'react';
import { motion } from 'framer-motion';
import type { SystemUser } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useTranslation } from '@/hooks/useTranslation';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { UsersListAvatar } from '@/tenant/features/users/components/UsersListAvatar';
import { UsersListRowActions } from '@/tenant/features/users/components/UsersListRowActions';

interface UsersListDesktopTableProps {
  users: SystemUser[];
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  formatLoginDate: (timestamp: string) => string;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function UsersListDesktopTable({
  users,
  selectedIds,
  canWrite,
  canDelete,
  showDeleted,
  formatLoginDate,
  onToggleSelect,
  onToggleAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onResetPassword,
  getColumnWidth,
  onColumnResize,
}: UsersListDesktopTableProps): JSX.Element {
  const { t } = useTranslation();

  return (
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
  );
}
