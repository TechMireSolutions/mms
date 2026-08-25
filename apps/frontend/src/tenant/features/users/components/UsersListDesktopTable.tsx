import type { JSX } from 'react';
import { motion } from 'framer-motion';
import type { SystemUser } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useListRowMotion } from '@/hooks/useListRowMotion';
import { UsersListAvatar } from '@/tenant/features/users/components/UsersListAvatar';
import { UsersRowActions } from '@/tenant/features/users/components/UsersRowActions';
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
      <ModuleWorkTableHeader
        columns={[
          { id: 'user', label: t('users.colUser'), headerClassName: 'px-3 py-2.5' },
          visible('role') ? { id: 'role', label: t('users.colRole'), headerClassName: 'px-3 py-2.5' } : null,
          visible('status') ? { id: 'status', label: t('users.colStatus'), headerClassName: 'px-3 py-2.5' } : null,
          visible('lastLogin') ? { id: 'lastLogin', label: t('users.colLastLogin'), headerClassName: 'px-3 py-2.5' } : null,
          visible('created') ? { id: 'created', label: t('users.colCreated'), headerClassName: 'px-3 py-2.5' } : null,
          visible('twoFactor') ? { id: 'twoFactor', label: t('users.col2fa'), headerClassName: 'px-3 py-2.5' } : null,
        ].filter((c): c is Exclude<typeof c, null> => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        actionsLabel={t('users.colActions')}
        selection={
          canDelete
            ? {
                allSelected,
                someSelected,
                onSelectAll: onToggleAll,
                ariaLabel: t('users.selectAll'),
              }
            : undefined
        }
      />
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
              <UsersRowActions
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
