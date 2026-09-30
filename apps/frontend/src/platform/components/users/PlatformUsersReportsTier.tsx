import { PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES } from '@mms/shared';
import { getPlatformAdminMetrics } from '@/platform/lib/platformAdminMetrics';
import { PLATFORM_PERMISSION_CONFIG } from '@/platform/lib/platformPermissionConfig';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import React from 'react';
import { ShieldCheck, ShieldAlert, Users, CheckCircle2, Lock } from 'lucide-react';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PlatformUsersReportsTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: admins, isLoading, isError, refetch } = usePlatformAdmins();

  if (isError) return <ErrorState description={t('errors.state.generic')} onRetry={() => { void refetch(); }} />;
  if (isLoading || !admins) return <CardSkeleton count={2} />;

  const { total, superUsers, standardAdmins, active, disabled, verified, verifiedPct } = getPlatformAdminMetrics(admins);
  const capabilityStats = PLATFORM_PERMISSION_CONFIG.map(({ key, labelKey }) => ({
    key, label: t(labelKey), count: admins.filter((admin) => admin.role === 'super_user' || admin.permissions[key]).length,
  }));

  return (
    <div className="space-y-6 text-start">
      <ModuleCommandMetricsGrid items={[
        { label: t('platform.manageAdmins'), value: total, icon: Users, accent: 'primary', sub: `${superUsers} ${t('platform.roleSuperUser')} · ${standardAdmins} ${t('platform.roleAdmin')}` },
        { label: t('platform.workspaceActive'), value: active, icon: CheckCircle2, accent: 'success', sub: `${disabled} ${t('platform.adminDisabled')}` },
        { label: t('platform.profileEmailVerified'), value: `${verifiedPct}%`, icon: ShieldCheck, accent: 'info', sub: `${verified} / ${total}` },
        { label: t('global.securitySessionBadge', { minutes: PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES }), value: PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES, icon: Lock, accent: 'warning' },
      ]} />

      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            {t('platform.capabilitiesLabel')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {capabilityStats.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground font-mono">{item.count} ({pct}%)</span>
                </div>
                <ProgressBar value={pct} size="md" aria-label={item.label} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
