import type { JSX } from 'react';
import { motion } from 'framer-motion';
import type { SystemUser } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { useListRowMotion } from '@/hooks/useListRowMotion';
import { UsersListAvatar } from '@/tenant/features/users/components/UsersListAvatar';
import { UsersListRowActions } from '@/tenant/features/users/components/UsersListRowActions';
import { renderUserWorkColumnValue } from '@/tenant/features/users/components/userWorkColumnCell';

interface UsersListDesktopTableProps {
  users: SystemUser[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
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
  isColumnVisible?: (key: string) => boolean;
}

export function UsersListDesktopTable({
  users,
  selectedIds,
  allSelected,
  someSelected,
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
  isColumnVisible,
}: UsersListDesktopTableProps): JSX.Element {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ layout: true });
  const visible = isColumnVisible ?? (() => true);

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
          {canDelete && (
            <TableHead className="w-8 px-3 py-2.5 h-auto">
              <Checkbox
                checked={someSelected ? 'indeterminate' : allSelected}
                onCheckedChange={onToggleAll}
                aria-label={allSelected ? t('common.deselect') : t('users.selectAll')}
              />
            </TableHead>
          )}
          <ModuleTableHeaderCell columnKey="user" width={getColumnWidth?.('user')} onResize={onColumnResize} className="px-3 py-2.5">
            {t('users.colUser')}
          </ModuleTableHeaderCell>
          {visible('role') && (
            <ModuleTableHeaderCell columnKey="role" width={getColumnWidth?.('role')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('users.colRole')}
            </ModuleTableHeaderCell>
          )}
          {visible('status') && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.('status')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('users.colStatus')}
            </ModuleTableHeaderCell>
          )}
          {visible('lastLogin') && (
            <ModuleTableHeaderCell columnKey="lastLogin" width={getColumnWidth?.('lastLogin')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('users.colLastLogin')}
            </ModuleTableHeaderCell>
          )}
          {visible('created') && (
            <ModuleTableHeaderCell columnKey="created" width={getColumnWidth?.('created')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('users.colCreated')}
            </ModuleTableHeaderCell>
          )}
          {visible('twoFactor') && (
            <ModuleTableHeaderCell columnKey="twoFactor" width={getColumnWidth?.('twoFactor')} onResize={onColumnResize} className="px-3 py-2.5">
              {t('users.col2fa')}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-3 py-2.5 text-end text-xs font-semibold uppercase text-muted-foreground h-auto">
            {t('users.colActions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border">
        {users.map((user) => (
          <motion.tr key={user.id} {...rowMotion()} className="transition-colors hover:bg-muted/20">
            {canDelete && (
              <TableCell className="px-3 py-2.5">
                <Checkbox
                  checked={selectedIds.includes(user.id)}
                  onCheckedChange={() => onToggleSelect(user.id)}
                  aria-label={t('users.selectRow', { name: user.name })}
                />
              </TableCell>
            )}
            <TableCell className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <UsersListAvatar user={user} />
                <div>
                  <p className="whitespace-nowrap text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </TableCell>
            {visible('role') && (
              <TableCell className="px-3 py-2.5">
                {renderUserWorkColumnValue(user, 'role', { t, formatLoginDate })}
              </TableCell>
            )}
            {visible('status') && (
              <TableCell className="px-3 py-2.5">
                {renderUserWorkColumnValue(user, 'status', { t, formatLoginDate })}
              </TableCell>
            )}
            {visible('lastLogin') && (
              <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                {renderUserWorkColumnValue(user, 'lastLogin', { t, formatLoginDate })}
              </TableCell>
            )}
            {visible('created') && (
              <TableCell className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                {renderUserWorkColumnValue(user, 'created', { t, formatLoginDate })}
              </TableCell>
            )}
            {visible('twoFactor') && (
              <TableCell className="px-3 py-2.5">
                {renderUserWorkColumnValue(user, 'twoFactor', { t, formatLoginDate })}
              </TableCell>
            )}
            <TableCell className="px-3 py-2.5 text-end">
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
            </TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}
