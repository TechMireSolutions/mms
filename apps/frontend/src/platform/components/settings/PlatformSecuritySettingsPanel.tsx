import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Clock, Key, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import { PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES } from '@mms/shared';

export function PlatformSecuritySettingsPanel(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 text-start">
      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Platform Security & Governance
          </CardTitle>
          <CardDescription className="text-xs">
            Apex security constraints, session policies, and step-up authentication standards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs font-medium">Idle Session Auto Sign-Out</div>
                <div className="text-3xs text-muted-foreground">Terminates inactive sessions to safeguard administrative access</div>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-3xs">
              {PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES} min
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs font-medium">Step-Up Password Verification</div>
                <div className="text-3xs text-muted-foreground">Mandatory password re-authentication for destructive actions (e.g. migrate & restart, deleting workspaces)</div>
              </div>
            </div>
            <Badge variant="outline" className="text-3xs text-success border-success/30 bg-success/5">
              Enforced
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs font-medium">Operator Two-Factor Authentication</div>
                <div className="text-3xs text-muted-foreground">Time-based one-time password (TOTP) verification</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-3xs">
              {t('platform.statusUnknown')}
            </Badge>
          </div>

          <div className="pt-2">
            <Button asChild variant="outline" className="min-h-11 rounded-xl text-xs cursor-pointer">
              <Link to={ROUTES.platformAccount}>
                Manage Personal Security & Password
                <ArrowRight className="w-3.5 h-3.5 ms-1.5 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Audit Logging & Compliance
          </CardTitle>
          <CardDescription className="text-xs">
            Append-only platform activity logs with IP tracking and operator attribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            All administrative actions, authentication attempts, tenant lifecycle events, and system migrations are written to the immutable <code className="text-3xs bg-muted px-1.5 py-0.5 rounded font-mono">platform_activity_logs</code> registry.
          </p>
          <div className="pt-2">
            <Button asChild variant="secondary" className="min-h-11 rounded-xl text-xs cursor-pointer">
              <Link to={ROUTES.platformActivityLogs}>
                View Platform Activity Logs
                <ArrowRight className="w-3.5 h-3.5 ms-1.5 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
