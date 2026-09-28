import React from 'react';
import { ShieldCheck, ShieldAlert, Users, CheckCircle2, Lock } from 'lucide-react';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PlatformUsersReportsTier(): React.JSX.Element {
  const { data: admins, isLoading } = usePlatformAdmins();

  if (isLoading || !admins) return <CardSkeleton count={2} />;

  const total = admins.length;
  const superUsers = admins.filter((a) => a.role === 'super_user').length;
  const standardAdmins = admins.filter((a) => a.role === 'admin').length;
  const disabled = admins.filter((a) => Boolean(a.disabledAt)).length;
  const verified = admins.filter((a) => Boolean(a.emailVerifiedAt)).length;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 100;

  const capabilityStats = [
    { key: 'workspaces', label: 'Workspaces Management', count: admins.filter((a) => a.role === 'super_user' || a.permissions?.workspaces).length },
    { key: 'onboard', label: 'Madrasa Onboarding', count: admins.filter((a) => a.role === 'super_user' || a.permissions?.onboard).length },
    { key: 'settings', label: 'Platform Settings', count: admins.filter((a) => a.role === 'super_user' || a.permissions?.settings).length },
    { key: 'admins', label: 'Operator Management', count: admins.filter((a) => a.role === 'super_user' || a.permissions?.admins).length },
    { key: 'system', label: 'System & Maintenance', count: admins.filter((a) => a.role === 'super_user' || a.permissions?.system).length },
  ];

  return (
    <div className="space-y-6 text-start">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Total Operators
              <Users className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-3xs text-muted-foreground mt-1">{superUsers} Super Users · {standardAdmins} Admins</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Active Status
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total - disabled}</div>
            <p className="text-3xs text-muted-foreground mt-1">{disabled} Disabled Operators</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Email Verified
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedPct}%</div>
            <p className="text-3xs text-muted-foreground mt-1">{verified} of {total} verified emails</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Security Level
              <Lock className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Standard</div>
            <p className="text-3xs text-muted-foreground mt-1">Idle Timeout: 30 min</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            Capability Distribution
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
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
