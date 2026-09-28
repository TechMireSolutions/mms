import React, { useMemo, useState, useDeferredValue } from 'react';
import { Check, X, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformAdmins, useUpdatePlatformAdminPermissions } from '@/platform/hooks/usePlatformAdmins';
import type { PlatformAdminPermissionKey, PlatformAdminPermissions, PlatformUserProfile } from '@mms/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

const CAPABILITIES: { key: PlatformAdminPermissionKey; label: string }[] = [
  { key: 'workspaces', label: 'Workspaces' },
  { key: 'onboard', label: 'Onboarding' },
  { key: 'settings', label: 'Settings' },
  { key: 'admins', label: 'Admins' },
  { key: 'system', label: 'System' },
];

export function PlatformPermissionMatrix(): React.JSX.Element {
  const { t } = useTranslation();
  const { isSuperUser, platformUser: currentUser } = usePlatformPermissions();
  const { data: admins, isLoading } = usePlatformAdmins();
  const updatePermissions = useUpdatePlatformAdminPermissions();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    if (!deferredSearch.trim()) return admins;
    const q = deferredSearch.toLowerCase();
    return admins.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [admins, deferredSearch]);

  const handleToggle = (admin: PlatformUserProfile, capKey: PlatformAdminPermissionKey) => {
    if (!isSuperUser || admin.role === 'super_user' || admin.id === currentUser?.id) return;
    const currentPerms = (admin.permissions ?? {}) as PlatformAdminPermissions;
    const nextPerms: PlatformAdminPermissions = {
      workspaces: currentPerms.workspaces ?? false,
      onboard: currentPerms.onboard ?? false,
      settings: currentPerms.settings ?? false,
      admins: currentPerms.admins ?? false,
      system: currentPerms.system ?? false,
      [capKey]: !currentPerms[capKey],
    };
    updatePermissions.mutate({ adminId: admin.id, permissions: nextPerms });
  };

  if (isLoading) return <CardSkeleton count={2} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="ps-9 h-10 rounded-xl"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {isSuperUser ? t('platform.roleSuperUser') : t('platform.adminLimitedDescription')}
        </span>
      </div>

      <div className="border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-mono text-3xs">
              <tr>
                <th className="py-3 px-4 text-start">{t('platform.descriptor.user.name')}</th>
                <th className="py-3 px-4 text-start">{t('platform.descriptor.user.role')}</th>
                {CAPABILITIES.map((cap) => (
                  <th key={cap.key} className="py-3 px-3 text-center">{cap.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <EmptyState title={t('platform.noMatchingAdmins')} compact />
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isRowSuper = admin.role === 'super_user';
                  const isSelf = admin.id === currentUser?.id;
                  const perms = admin.permissions ?? {};
                  return (
                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{admin.name}</div>
                        <div className="text-muted-foreground text-3xs">{admin.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isRowSuper ? 'default' : 'secondary'} className="text-3xs">
                          {isRowSuper ? t('platform.roleSuperUser') : t('platform.roleAdmin')}
                        </Badge>
                      </td>
                      {CAPABILITIES.map((cap) => {
                        const granted = isRowSuper || Boolean(perms[cap.key]);
                        const disabled = !isSuperUser || isRowSuper || isSelf || updatePermissions.isPending;
                        return (
                          <td key={cap.key} className="py-3 px-3 text-center">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => handleToggle(admin, cap.key)}
                              className={cn(
                                'inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all',
                                granted ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground/40',
                                !disabled && 'hover:ring-2 hover:ring-primary/30 cursor-pointer',
                              )}
                              aria-label={`${cap.label}: ${granted ? 'granted' : 'denied'}`}
                            >
                              {granted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
