import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Eye, Pencil, KeyRound,
  Mail, MessageCircle, MessageSquare, Trash2, RotateCcw,
} from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { FormSelect } from '@/components/ui/FormSelect';
import {
  type SystemUser,
  workspaceRoleLabel,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';

interface AvatarProps {
  user: SystemUser;
}

function Avatar({ user }: AvatarProps): React.JSX.Element {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <span className="text-xs font-bold text-primary">{user.avatarInitials}</span>
    </div>
  );
}

export interface UsersListProps {
  users: SystemUser[];
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onResetPassword: (user: SystemUser) => void;
  onAddUser: () => void;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', users: SystemUser[]) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: (next: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function UsersList({
  users,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onResetPassword,
  onAddUser,
  onMessage,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  onToggleDeleted,
  getColumnWidth,
  onColumnResize,
}: UsersListProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        if (!showDeleted && statusFilter !== 'all' && user.status !== statusFilter) return false;
        if (search) {
          const searchQuery = search.toLowerCase();
          if (!user.name.toLowerCase().includes(searchQuery) && !user.email.toLowerCase().includes(searchQuery)) return false;
        }
        return true;
      }),
    [users, search, roleFilter, statusFilter, showDeleted],
  );

  const toggleSelect = (id: string): void =>
    setSelected((selectedIds) => (selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id]));
  const toggleAll = (): void =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((user) => user.id));

  const handleBulkMessage = (channel: 'sms' | 'whatsapp' | 'email') => {
    const selectedUsers = users.filter((u) => selected.includes(u.id));
    onMessage?.(channel, selectedUsers);
  };

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('users.searchPlaceholder')}
          className="min-w-[180px] flex-1"
        />
        <FormSelect
          id="role-filter"
          name="role-filter"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'all', label: t('users.filterAllRoles') },
            ...workspaceRoles.map((workspaceRole) => ({
              value: workspaceRole.id,
              label: workspaceRoleLabel(workspaceRole, t),
            })),
          ]}
          aria-label={t('users.filterRole')}
          className="w-auto"
        />
        {!showDeleted ? (
          <FormSelect
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={setStatus}
            options={[
              { value: 'all', label: t('users.filterAllStatuses') },
              { value: 'active', label: t('users.status.active') },
              { value: 'inactive', label: t('users.status.inactive') },
              { value: 'suspended', label: t('users.status.suspended') },
            ]}
            aria-label={t('users.filterStatus')}
            className="w-auto"
          />
        ) : null}

        {canDelete ? (
          <Button
            type="button"
            size="sm"
            variant={showDeleted ? 'outline' : 'destructive'}
            onClick={() => {
              setSelected([]);
              onToggleDeleted?.(!showDeleted);
            }}
          >
            {showDeleted ? (
              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
            )}
            {showDeleted ? t('users.trash.showActive') : t('users.trash.showDeleted')}
          </Button>
        ) : null}
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
          >
            <span className="text-sm font-semibold text-foreground">
              {t('users.selectedCount', { count: selected.length })}
            </span>
            <div className="flex gap-2 items-center flex-wrap">
              {onMessage && !showDeleted && (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('email')}>
                    <Mail className="h-3 w-3 me-1 text-primary" />
                    {t('users.sendEmail')}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('whatsapp')}>
                    <MessageCircle className="h-3 w-3 me-1 text-success" />
                    {t('messaging.channel.whatsapp')}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('sms')}>
                    <MessageSquare className="h-3 w-3 me-1 text-info" />
                    {t('users.sendSms')}
                  </Button>
                </>
              )}
              {canDelete && (
                <>
                  {showDeleted ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        onBulkRestore(selected);
                        setSelected([]);
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      {t('users.trash.bulkRestore')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onBulkDelete(selected);
                        setSelected([]);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('users.trash.bulkDelete')}
                    </Button>
                  )}
                </>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>
                {t('users.bulkClear')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
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
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="border-b border-border bg-muted/60">
                <tr>
                  {canDelete && (
                    <th className="w-8 px-3 py-2.5">
                      <Checkbox
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onCheckedChange={() => toggleAll()}
                        aria-label={t('users.selectAll')}
                      />
                    </th>
                  )}
                  <ResizableTableHead
                    columnKey="user"
                    width={getColumnWidth?.('user')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.colUser')}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnKey="role"
                    width={getColumnWidth?.('role')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.colRole')}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnKey="status"
                    width={getColumnWidth?.('status')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.colStatus')}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnKey="lastLogin"
                    width={getColumnWidth?.('lastLogin')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.colLastLogin')}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnKey="created"
                    width={getColumnWidth?.('created')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.colCreated')}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnKey="twoFactor"
                    width={getColumnWidth?.('twoFactor')}
                    onResize={onColumnResize}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground"
                  >
                    {t('users.col2fa')}
                  </ResizableTableHead>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                    {t('users.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <motion.tr key={user.id} layout className="transition-colors hover:bg-muted/20">
                    {canDelete && (
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={selected.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          aria-label={t('users.selectRow', { name: user.name })}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={user} />
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
                      {fmtDate(user.lastLogin)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {user.createdDate}
                    </td>
                    <td className="px-3 py-2.5">
                      <SettingsMetaBadge variant={user.twoFactorEnabled ? 'success' : 'muted'}>
                        {user.twoFactorEnabled ? t('users.twoFactorOn') : t('users.twoFactorOff')}
                      </SettingsMetaBadge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onView(user)}
                          aria-label={t('users.actionView', { name: user.name })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canWrite && !showDeleted && (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => onEdit(user)}
                              aria-label={t('users.actionEdit', { name: user.name })}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => onResetPassword(user)}
                              aria-label={t('users.actionResetPassword', { name: user.name })}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => (showDeleted ? onRestore(user.id) : onDelete(user.id))}
                            aria-label={
                              showDeleted
                                ? t('users.trash.restore')
                                : t('users.trash.delete', { name: user.name })
                            }
                          >
                            {showDeleted ? (
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {t('users.shownCount', { count: filtered.length })}
      </p>
    </div>
  );
}
