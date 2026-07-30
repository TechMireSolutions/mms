import type { JSX } from 'react';
import { motion } from 'framer-motion';
import type { SystemUser } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useTranslation } from '@/hooks/useTranslation';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { UsersListAvatar } from '@/tenant/features/users/components/UsersListAvatar';
import { UsersListRowActions } from '@/tenant/features/users/components/UsersListRowActions';

interface UsersListMobileCardsProps {
  users: SystemUser[];
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  formatLoginDate: (timestamp: string) => string;
  onToggleSelect: (id: string) => void;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
}

export function UsersListMobileCards({
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
}: UsersListMobileCardsProps): JSX.Element {
  const { t } = useTranslation();

  return (
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
  );
}
