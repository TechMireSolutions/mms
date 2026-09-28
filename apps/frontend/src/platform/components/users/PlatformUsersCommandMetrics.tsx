import React from 'react';
import { ShieldCheck, UserCheck, Crown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { StatsSkeleton } from '@/components/ui/LoadingState';
import type { PlatformUserProfile } from '@mms/shared';

export interface PlatformUsersCommandMetricsProps {
  admins: PlatformUserProfile[] | undefined;
  loading: boolean;
  error: boolean;
}

export function PlatformUsersCommandMetrics({
  admins,
  loading,
  error,
}: PlatformUsersCommandMetricsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (error) return null;
  if (loading || !admins) {
    return <StatsSkeleton count={3} />;
  }

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => !a.disabledAt).length;
  const superAdmins = admins.filter((a) => a.role === 'super_user').length;

  return (
    <ModuleCommandMetricsGrid
      items={[
        {
          icon: ShieldCheck,
          label: t('platform.manageAdmins'),
          value: totalAdmins,
          accent: 'primary',
        },
        {
          icon: UserCheck,
          label: t('platform.workspaceActive'),
          value: activeAdmins,
          accent: 'success',
        },
        {
          icon: Crown,
          label: t('platform.roleSuperUser'),
          value: superAdmins,
          accent: 'warning',
        },
      ]}
    />
  );
}
