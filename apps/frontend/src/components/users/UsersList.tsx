import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, Eye, Pencil, KeyRound,
  CheckCircle2, XCircle,
  Power,
} from 'lucide-react';
import {
  type SystemUser,
  workspaceRoleLabel,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useIsAdminViewer } from '@/hooks/useViewerRole';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import { formatDate } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { UserRoleBadge, UserStatusBadge } from '@/components/users/UserBadges';

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
  onToggleStatus: (id: string, status: 'active' | 'inactive') => void;
  onResetPassword: (user: SystemUser) => void;
  onInvite: () => void;
  onAddUser: () => void;
}

export function UsersList({
  users,
  onView,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onInvite,
  onAddUser,
}: UsersListProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const isAdmin = useIsAdminViewer();
  const workspaceRoles = useWorkspaceRoles();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        if (statusFilter !== 'all' && user.status !== statusFilter) return false;
        if (search) {
          const searchQuery = search.toLowerCase();
          if (!user.name.toLowerCase().includes(searchQuery) && !user.email.toLowerCase().includes(searchQuery)) return false;
        }
        return true;
      }),
    [users, search, roleFilter, statusFilter],
  );

  const toggleSelect = (id: string): void =>
    setSelected((selectedIds) => (selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id]));
  const toggleAll = (): void =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((user) => user.id));

  const bulkAction = (action: 'activate' | 'deactivate'): void => {
    selected.forEach((userId) => {
      const selectedUser = users.find((user) => user.id === userId);
      if (selectedUser) onToggleStatus(userId, action === 'activate' ? 'active' : 'inactive');
    });
    setSelected([]);
  };

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="user-search"
            name="user-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          id="role-filter"
          name="role-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('users.filterRole')}
        >
          <option value="all">{t('users.filterAllRoles')}</option>
          {workspaceRoles.map((workspaceRole) => (
            <option key={workspaceRole.id} value={workspaceRole.id}>
              {workspaceRoleLabel(workspaceRole, t)}
            </option>
          ))}
        </select>
        <select
          id="status-filter"
          name="status-filter"
          value={statusFilter}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('users.filterStatus')}
        >
          <option value="all">{t('users.filterAllStatuses')}</option>
          <option value="active">{t('users.status.active')}</option>
          <option value="inactive">{t('users.status.inactive')}</option>
          <option value="suspended">{t('users.status.suspended')}</option>
        </select>
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
          >
            <span className="text-sm font-semibold text-foreground">
              {t('users.selectedCount', { count: selected.length })}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => bulkAction('activate')}>
                <CheckCircle2 className="h-3 w-3" />
                {t('users.bulkActivate')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => bulkAction('deactivate')}>
                <XCircle className="h-3 w-3" />
                {t('users.bulkDeactivate')}
              </Button>
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
              {search || roleFilter !== 'all' || statusFilter !== 'all'
                ? t('users.emptyFiltered')
                : t('users.emptyHint')}
            </p>
          </div>
          {isAdmin && !search && roleFilter === 'all' && statusFilter === 'all' && (
            <Button type="button" onClick={onAddUser}>
              <UserPlus className="h-3.5 w-3.5" />
              {t('users.addFirst')}
            </Button>
          )}
        </div>
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/60">
                <tr>
                  {isAdmin && (
                    <th className="w-8 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                        aria-label={t('users.selectAll')}
                      />
                    </th>
                  )}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colUser')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colRole')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colStatus')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colLastLogin')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colCreated')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.col2fa')}
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-muted-foreground">
                    {t('users.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <motion.tr key={user.id} layout className="transition-colors hover:bg-muted/20">
                    {isAdmin && (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded"
                          aria-label={t('users.selectRow', { name: user.name })}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={user} />
                        <div>
                          <p className="whitespace-nowrap text-sm font-semibold text-foreground">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email}</p>
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
                        {isAdmin && (
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
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                onToggleStatus(user.id, user.status === 'active' ? 'inactive' : 'active')
                              }
                              aria-label={t('users.actionToggleStatus', { name: user.name })}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                          </>
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
