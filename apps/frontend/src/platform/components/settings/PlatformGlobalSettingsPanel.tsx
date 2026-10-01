import React, { useState, useEffect } from 'react';
import { Globe, Save } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformSettingsQuery, useUpdatePlatformSettings } from '@/platform/hooks/usePlatformSettings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CardSkeleton } from '@/components/ui/LoadingState';

export function PlatformGlobalSettingsPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: settings, isLoading } = usePlatformSettingsQuery();
  const updateSettings = useUpdatePlatformSettings();

  const [syncTls, setSyncTls] = useState(true);
  const [tlsExtraSans, setTlsExtraSans] = useState('');
  const [certbotEmail, setCertbotEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setSyncTls(settings.syncTlsOnCreate ?? true);
      setTlsExtraSans(settings.tlsExtraSans ?? '');
      setCertbotEmail(settings.certbotEmail ?? '');
    }
  }, [settings]);

  if (isLoading) return <CardSkeleton count={2} />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      syncTlsOnCreate: syncTls,
      tlsExtraSans,
      certbotEmail,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-start">
      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            TLS & Domain Certificates
          </CardTitle>
          <CardDescription className="text-xs">
            Configure automated Let's Encrypt certificate issuance and SAN bindings for new workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div>
              <label htmlFor="sync-tls" className="text-xs font-medium cursor-pointer">Automatic TLS Sync on Provision</label>
              <div className="text-3xs text-muted-foreground">Trigger Certbot certificate expansion upon workspace creation</div>
            </div>
            <Switch
              id="sync-tls"
              checked={syncTls}
              onCheckedChange={setSyncTls}
              aria-label="Automatic TLS Sync"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="certbot-email" className="text-xs font-medium text-foreground">Certbot Contact Email</label>
            <Input
              id="certbot-email"
              type="email"
              value={certbotEmail}
              onChange={(e) => setCertbotEmail(e.target.value)}
              placeholder="admin@example.com"
              className="h-10 rounded-xl"
            />
            <p className="text-3xs text-muted-foreground">Used for certificate expiry alerts from Let's Encrypt.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tls-extra-sans" className="text-xs font-medium text-foreground">Extra SAN Domains</label>
            <Input
              id="tls-extra-sans"
              value={tlsExtraSans}
              onChange={(e) => setTlsExtraSans(e.target.value)}
              placeholder="apex.example.com, admin.example.com"
              className="h-10 rounded-xl font-mono text-xs"
            />
            <p className="text-3xs text-muted-foreground">Comma-separated extra Subject Alternative Names to include in certificates.</p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={updateSettings.isPending}
              className="min-h-11 rounded-xl px-5 font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4 me-2" />
              {updateSettings.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
