import React from 'react';
import { Lock } from 'lucide-react';
import type { filterRbacModulesForSettings, PermissionAction } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';

export interface UserDetailPermissionsCardProps {
  effectivePerms: Record<string, PermissionAction[]>;
  visibleModules: ReturnType<typeof filterRbacModulesForSettings>;
}

export function UserDetailPermissionsCard({
  effectivePerms,
  visibleModules,
}: UserDetailPermissionsCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t('users.detailPermissions')}</DetailSectionTitle>
      <Card accentColor="warning" className="divide-y divide-border/50 p-0">
        <DetailAttributeRow
          variant="inset"
          icon={Lock}
          label={t('users.detailPermissions')}
          value={
            <div className="space-y-3">
              {visibleModules.map((mod) => {
                const perms = effectivePerms[mod.id] ?? [];
                if (perms.length === 0) return null;
                return (
                  <div key={mod.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">{t(mod.labelKey)}</span>
                    {perms.map((action) => (
                      <SettingsMetaBadge key={`${mod.id}-${action}`} variant="muted">
                        {t(`users.permission.${action}`)}
                      </SettingsMetaBadge>
                    ))}
                  </div>
                );
              })}
              {Object.keys(effectivePerms).length === 0 ? (
                <span className="text-muted-foreground font-normal">{t('users.detailNoPermissions')}</span>
              ) : null}
            </div>
          }
        />
      </Card>
    </div>
  );
}
